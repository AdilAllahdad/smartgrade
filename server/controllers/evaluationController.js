const asyncHandler = require('express-async-handler');
const Result = require('../models/resultModel');
const ExamPaper = require('../models/examPaperModel');
const { evaluateSubmission: standardEvaluate } = require('../services/evaluationService');
const { evaluateSubmission: llmEvaluate, isLLMEnabled } = require('../services/llmEvaluationService');
const { notifyGuardianOfResult } = require('../services/notificationService');

// Get the StudentSubmission model from mongoose directly
const mongoose = require('mongoose');
const StudentSubmission = mongoose.model('StudentSubmission');

// @desc    Evaluate student submission
// @route   POST /api/evaluate
// @access  Private (Teachers only)
const evaluateSubmission = asyncHandler(async (req, res) => {
    try {
        // Handle both FormData and direct JSON submissions
        let evaluationData;
        
        if (req.body.data) {
            // Handle FormData submission
            evaluationData = JSON.parse(req.body.data);
        } else {
            // Handle direct JSON submission
            evaluationData = req.body;
        }

        // Get evaluation mode from request or use environment default
        const evaluationMode = req.body.evaluationMode || 
                              req.query.evaluationMode || 
                              process.env.DEFAULT_EVALUATION_MODE || 
                              'standard';

        console.log('Received evaluation request:', {
            evaluationMode: evaluationMode,
            studentData: {
                submissionId: evaluationData?.studentSubmission?.metadata?.submissionId,
                filename: evaluationData?.studentSubmission?.metadata?.filename
            },
            answerData: {
                examId: evaluationData?.answerSheet?.metadata?.examId,
                filename: evaluationData?.answerSheet?.metadata?.filename
            }
        });

        // Choose evaluation service based on mode
        let evaluationResults;
        let evaluationMethod;

        if (evaluationMode === 'llm' && isLLMEnabled()) {
            console.log('Using LLM-based evaluation');
            evaluationResults = await llmEvaluate(evaluationData);
            evaluationMethod = 'LLM-Enhanced';
        } else if (evaluationMode === 'llm' && !isLLMEnabled()) {
            console.warn('LLM evaluation requested but not available - falling back to standard evaluation');
            evaluationResults = await standardEvaluate(evaluationData);
            evaluationMethod = 'Standard (LLM unavailable)';
        } else {
            console.log('Using standard evaluation');
            evaluationResults = await standardEvaluate(evaluationData);
            evaluationMethod = 'Standard';
        }

        // Add evaluation method to results
        evaluationResults.metadata = {
            ...evaluationResults.metadata,
            evaluationMethod: evaluationMethod,
            evaluationMode: evaluationMode
        };

        // Only create a result record if we have complete data
        if (evaluationData?.answerSheet?.metadata?.examId && 
            evaluationData?.studentSubmission?.metadata?.submissionId) {
            try {
                // For development - create a placeholder user ID if not authenticated
                const userId = req.user?._id || '65e1963310226833e4bfd1f1'; // Default teacher ID
                
                const result = new Result({
                    student: userId, // Use placeholder ID in development
                    exam: evaluationData.answerSheet.metadata.examId,
                    submission: evaluationData.studentSubmission.metadata.submissionId,
                    score: evaluationResults.scoreSummary.totalObtained,
                    maxScore: evaluationResults.scoreSummary.totalMarks,
                    percentage: evaluationResults.scoreSummary.totalMarks > 0 
                        ? Math.round((evaluationResults.scoreSummary.totalObtained / evaluationResults.scoreSummary.totalMarks) * 100)
                        : 0,
                    evaluationDetails: {
                        mcqResults: evaluationResults.mcqResults,
                        shortQuestionResults: evaluationResults.shortQuestionResults,
                        evaluationMethod: evaluationMethod
                    },
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
            ...evaluationResults
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
        submission.score = scoreSummary.totalObtained || 0;  // Update score field
        submission.evaluatedAt = new Date();
        submission.resultId = result._id;  // Connect submission to the result
        await submission.save();
        
        // Send notification to guardian
        let notificationStatus = {
            sent: false,
            message: 'No guardian notification sent',
            details: null
        };
        
        try {
            // Populate student's guardian information
            const Student = mongoose.model('Student');
            const Guardian = mongoose.model('Guardian');
            
            const studentWithGuardian = await Student.findById(submission.student._id).populate('guardian');
            
            if (studentWithGuardian && studentWithGuardian.guardian) {
                const guardian = await Guardian.findById(studentWithGuardian.guardian);
                
                if (guardian && guardian.phoneNumber) {
                    console.log('Sending notification to guardian...');
                    
                    const notificationResult = await notifyGuardianOfResult(
                        guardian,
                        studentWithGuardian,
                        submission.examPaper,
                        {
                            score: scoreSummary.totalObtained,
                            maxScore: scoreSummary.totalMarks,
                            percentage: result.percentage
                        }
                    );
                    
                    if (notificationResult.success) {
                        console.log('✓ Guardian notification sent successfully');
                        notificationStatus = {
                            sent: true,
                            message: notificationResult.status === 'logged' 
                                ? 'SMS logged (Twilio not configured)' 
                                : 'SMS sent successfully',
                            details: {
                                guardianName: guardian.name,
                                guardianPhone: notificationResult.to,
                                messageId: notificationResult.messageId,
                                status: notificationResult.status,
                                isProduction: notificationResult.status !== 'logged'
                            }
                        };
                    } else {
                        console.warn('⚠ Guardian notification failed:', notificationResult.error);
                        notificationStatus = {
                            sent: false,
                            message: 'SMS failed to send',
                            details: { error: notificationResult.error }
                        };
                    }
                } else {
                    console.warn('⚠ Guardian phone number not available');
                    notificationStatus = {
                        sent: false,
                        message: 'Guardian has no phone number'
                    };
                }
            } else {
                console.warn('⚠ No guardian linked to student');
                notificationStatus = {
                    sent: false,
                    message: 'No guardian linked to student'
                };
            }
        } catch (notificationError) {
            // Log but don't fail the request if notification fails
            console.error('Error sending guardian notification:', notificationError);
            notificationStatus = {
                sent: false,
                message: 'Notification error occurred',
                details: { error: notificationError.message }
            };
        }
        
        res.status(200).json({
            success: true,
            message: 'Evaluation results saved successfully',
            resultId: result._id,
            notification: notificationStatus
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
