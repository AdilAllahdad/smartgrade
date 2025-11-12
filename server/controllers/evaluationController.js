const asyncHandler = require('express-async-handler');
const Result = require('../models/resultModel');
const ExamPaper = require('../models/examPaperModel');

// Get the StudentSubmission model from mongoose directly
const mongoose = require('mongoose');
const StudentSubmission = mongoose.model('StudentSubmission');

// @desc    Evaluate student submission
// @route   POST /api/evaluate
// @access  Private (Teachers only)
const evaluateSubmission = asyncHandler(async (req, res) => {
    try {
        // Handle both FormData and direct JSON submissions
        let studentSubmission, answerSheet;
        
        if (req.body.data) {
            // Handle FormData submission
            const parsedData = JSON.parse(req.body.data);
            studentSubmission = parsedData.studentSubmission;
            answerSheet = parsedData.answerSheet;
        } else {
            // Handle direct JSON submission
            studentSubmission = req.body.studentSubmission; 
            answerSheet = req.body.answerSheet;
        }

        console.log('Received evaluation request:', {
            studentData: {
                submissionId: studentSubmission?.metadata?.submissionId,
                filename: studentSubmission?.metadata?.filename
            },
            answerData: {
                examId: answerSheet?.metadata?.examId,
                filename: answerSheet?.metadata?.filename
            }
        });

        // Perform evaluation logic here
        // This is where you would compare the student's answers with the correct answers

        // Example evaluation (simplified)
        let totalScore = 0;
        let maxScore = 0;
        const evaluationResults = {
            mcqResults: [],
            shortQuestionResults: []
        };

        // Evaluate MCQs
        if (studentSubmission.mcqs && answerSheet.mcqs) {
            for (const studentMCQ of studentSubmission.mcqs) {
                const matchingAnswer = answerSheet.mcqs.find(
                    mcq => mcq.questionNumber === studentMCQ.questionNumber
                );

                if (matchingAnswer) {
                    const isCorrect = studentMCQ.selectedOption === matchingAnswer.correctOption;
                    const questionScore = isCorrect ? 1 : 0;
                    totalScore += questionScore;
                    maxScore += 1;

                    evaluationResults.mcqResults.push({
                        questionNumber: studentMCQ.questionNumber,
                        studentAnswer: studentMCQ.selectedOption,
                        correctAnswer: matchingAnswer.correctOption,
                        isCorrect,
                        score: questionScore
                    });
                }
            }
        }

        // Evaluate Short Questions (simplified - this would normally be done by a teacher)
        // For now, we'll just record the answers for manual review
        if (studentSubmission.shortQuestions && answerSheet.shortQuestions) {
            for (const studentQuestion of studentSubmission.shortQuestions) {
                const matchingAnswer = answerSheet.shortQuestions.find(
                    q => q.questionNumber === studentQuestion.questionNumber
                );

                if (matchingAnswer) {
                    // For short questions, we just store the answers for manual review
                    evaluationResults.shortQuestionResults.push({
                        questionNumber: studentQuestion.questionNumber,
                        studentAnswer: studentQuestion.answer,
                        modelAnswer: matchingAnswer.answer
                    });
                }
            }
        }

        // Calculate percentage score
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        // Only create a result record if we have complete data
        if (answerSheet?.metadata?.examId && studentSubmission?.metadata?.submissionId) {
            try {
                // For development - create a placeholder user ID if not authenticated
                const userId = req.user?._id || '65e1963310226833e4bfd1f1'; // Default teacher ID
                
                const result = new Result({
                    student: userId, // Use placeholder ID in development
                    exam: answerSheet.metadata.examId,
                    submission: studentSubmission.metadata.submissionId,
                    score: totalScore,
                    maxScore: maxScore,
                    percentage: percentage,
                    evaluationDetails: evaluationResults,
                    gradedBy: userId,
                    gradedAt: new Date()
                });
                
                await result.save();
                console.log('Result saved successfully');
            } catch (saveError) {
                console.error('Error saving result:', saveError);
                // Continue - don't fail the whole request if saving fails
            }
        } else {
            console.log('Skipping result creation - missing required metadata');
        }

        res.status(200).json({
            success: true,
            message: 'Evaluation completed successfully',
            result: {
                score: totalScore,
                maxScore,
                percentage,
                evaluationDetails: evaluationResults
            }
        });
    } catch (error) {
        console.error('Evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error evaluating submission',
            error: error.message
        });
    }
});

// @desc    Save evaluation results
// @route   POST /api/evaluate/save
// @access  Private (Teachers only)
const saveEvaluationResults = asyncHandler(async (req, res) => {
    try {
        const { submissionId, evaluationData } = req.body;
        
        if (!submissionId || !evaluationData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Submission ID and evaluation data are required' 
            });
        }
        
        // Extract necessary data from the evaluation results
        const { 
            mcqResults = [], 
            shortQuestionResults = [],
            scoreSummary = {} 
        } = evaluationData;
        
        // Get teacher information from request
        const teacherId = req.user?._id;
        if (!teacherId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Teacher authentication required' 
            });
        }

        // Find the submission to get student and exam info
        const submission = await StudentSubmission.findById(submissionId)
            .populate('student')
            .populate('examPaper'); // Changed from 'exam' to 'examPaper' to match the schema
            
        if (!submission) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student submission not found' 
            });
        }
        
        // Structure the evaluation details from LLM results
        const evaluationDetails = {
            mcqResults: mcqResults.map(mcq => ({
                questionNumber: mcq.id,
                studentAnswer: mcq.studentAnswer,
                correctAnswer: mcq.correctAnswer,
                isCorrect: mcq.correct,
                score: mcq.obtainedMarks
            })),
            shortQuestionResults: shortQuestionResults.map(q => ({
                questionNumber: q.id,
                studentAnswer: q.studentAnswer,
                modelAnswer: q.correctAnswer,
                score: q.obtainedMarks,
                feedback: q.feedback
            }))
        };
        
        // Create a new result record
        const result = new Result({
            student: submission.student,
            exam: submission.examPaper, // Changed from submission.exam to submission.examPaper
            submission: submissionId,
            score: scoreSummary.totalObtained || 0,
            maxScore: scoreSummary.totalMarks || 0,
            percentage: scoreSummary.totalMarks > 0 
                ? Math.round((scoreSummary.totalObtained / scoreSummary.totalMarks) * 100) 
                : 0,
            evaluationDetails: evaluationDetails,
            gradedBy: teacherId,
            gradedAt: new Date()
        });
        
        // Save the result
        await result.save();
        
        // Update the submission to mark it as evaluated and link to the result
        submission.status = 'evaluated';
        submission.evaluatedAt = new Date();
        submission.resultId = result._id;  // Connect submission to the result
        await submission.save();
        
        res.status(200).json({
            success: true,
            message: 'Evaluation results saved successfully',
            resultId: result._id
        });
        
    } catch (error) {
        console.error('Error saving evaluation results:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving evaluation results',
            error: error.message
        });
    }
});

module.exports = {
    evaluateSubmission,
    saveEvaluationResults
};
