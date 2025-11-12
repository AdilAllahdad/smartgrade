import React from 'react';
import { processDocument } from './documentProcessing';

/**
 * Processes student submission and answer sheet, and prepares data for evaluation
 * 
 * @param {Object} studentSubmission - Student submission document
 * @param {Object} answerSheet - Answer sheet document
 * @returns {Object} Processed data ready for evaluation
 */
export const processDocumentsForEvaluation = async (studentSubmission, answerSheet) => {
    // Make sure both documents are available
    if (!studentSubmission) {
        throw new Error('Student submission is not available');
    }
    
    if (!answerSheet) {
        throw new Error('Answer sheet is not available');
    }
    
    console.log('Starting document processing...');
    
    // For debugging
    console.log('About to process:');
    console.log('Student submission:', studentSubmission.filename);
    console.log('Answer sheet:', answerSheet.filename);
    
    // Process documents sequentially for better debugging
    console.log('Processing student submission...');
    const studentResult = await processDocument(studentSubmission, false);
    console.log('Processing answer sheet...');
    const answerSheetResult = await processDocument(answerSheet, true);
    
    // Check for processing errors
    if (studentResult.error) {
        throw new Error(`Error processing student submission: ${studentResult.error}`);
    }
    
    if (answerSheetResult.error) {
        throw new Error(`Error processing answer sheet: ${answerSheetResult.error}`);
    }

    // Make sure MCQs in student submissions have selectedAnswer (not correctAnswer)
    // First deduplicate by question number to avoid sending the same question multiple times
    const uniqueMCQs = [];
    const mcqNumbers = new Set();
    
    (studentResult.mcqs || []).forEach(q => {
        if (!mcqNumbers.has(q.questionNumber)) {
            mcqNumbers.add(q.questionNumber);
            uniqueMCQs.push(q);
        } else {
            console.log(`Skipping duplicate MCQ Q${q.questionNumber} from student submission`);
        }
    });
    
    const processedStudentMCQs = uniqueMCQs.map(q => {
        // If a student's "correctAnswer" field is populated, move it to selectedAnswer
        if (q.correctAnswer && !q.selectedAnswer) {
            q.selectedAnswer = q.correctAnswer;
            q.correctAnswer = null; // Clear incorrect field
        }
        return q;
    });
    
    // Make sure MCQs in answer sheet have correctAnswer properly set
    // First deduplicate by question number to avoid sending the same answer multiple times
    const uniqueAnswerSheetMCQs = [];
    const answerSheetMcqNumbers = new Set();
    
    (answerSheetResult.mcqs || []).forEach(q => {
        if (!answerSheetMcqNumbers.has(q.questionNumber)) {
            answerSheetMcqNumbers.add(q.questionNumber);
            uniqueAnswerSheetMCQs.push(q);
        } else {
            console.log(`Skipping duplicate MCQ Q${q.questionNumber} from answer sheet`);
        }
    });
    
    const processedAnswerSheetMCQs = uniqueAnswerSheetMCQs.map(q => {
        // Ensure correctAnswer is preserved
        if (q.selectedAnswer && !q.correctAnswer) {
            q.correctAnswer = q.selectedAnswer;
            q.selectedAnswer = null; // Clear incorrect field
        }
        return q;
    });

    // Create a mapping of question numbers to correct answers from the answer sheet
    const correctAnswersMap = {};
    processedAnswerSheetMCQs.forEach(q => {
        if (q.questionNumber && q.correctAnswer) {
            correctAnswersMap[q.questionNumber] = {
                correctAnswer: q.correctAnswer,
                answerText: q.answerText || '',
                marks: q.marks || null // Include marks in the map
            };
        }
    });
    
    console.log('Correct answers map:', correctAnswersMap);
    
    // If the answer sheet MCQs are empty but we have the direct format answers,
    // create proper MCQ objects from the direct answers
    let finalAnswerSheetMCQs = processedAnswerSheetMCQs;
    if (finalAnswerSheetMCQs.length === 0 && answerSheetResult.mcqs && 
        answerSheetResult.mcqs.length > 0) {
        console.log('Using direct format answers for MCQs');
        finalAnswerSheetMCQs = answerSheetResult.mcqs;
    }
    
    // If we still don't have any MCQs in the answer sheet but we have some in the student submission,
    // create a fallback set based on the student submission structure
    if (finalAnswerSheetMCQs.length === 0 && processedStudentMCQs.length > 0) {
        console.log('Creating fallback MCQs for answer sheet');
        // Get sample answer keys from the raw text
        const rawText = answerSheetResult.extractedText || '';
        const mcqAnswersSection = rawText.match(/MCQ Answers([\s\S]*?)(?=Short Answer Keys|$)/i);
        const mcqText = mcqAnswersSection ? mcqAnswersSection[1] : '';
        console.log('MCQ text from answer sheet:', mcqText);
        
        const answerLines = mcqText.split('\n');
        const directAnswers = {};
        
        answerLines.forEach(line => {
            const match = line.match(/Q(\d+):\s*([A-Da-d])[)\s]/i);
            if (match) {
                const qNum = parseInt(match[1]);
                const correctAns = match[2].toUpperCase();
                directAnswers[qNum] = correctAns;
            }
        });
        
        console.log('Direct answers extracted:', directAnswers);
        
        // Create answer sheet MCQs based on student questions but with correct answers
        finalAnswerSheetMCQs = processedStudentMCQs.map(studentQ => {
            const qNum = studentQ.questionNumber;
            // Use the direct answer if available, otherwise use a placeholder
            const correctAns = directAnswers[qNum] || correctAnswersMap[qNum]?.correctAnswer || '?';
            // Preserve marks if they exist
            const marks = studentQ.marks || correctAnswersMap[qNum]?.marks || null;
            
            return {
                ...studentQ,
                selectedAnswer: null,
                correctAnswer: correctAns,
                marks: marks // Include marks in the fallback MCQs
            };
        });
    }
    
    // Process short questions to ensure they have proper structure
    // First deduplicate by question number to avoid sending the same question multiple times
    const uniqueShortQuestions = [];
    const shortQuestionNumbers = new Set();
    
    (studentResult.shortQuestions || []).forEach(q => {
        if (!shortQuestionNumbers.has(q.questionNumber)) {
            shortQuestionNumbers.add(q.questionNumber);
            uniqueShortQuestions.push(q);
        } else {
            console.log(`Skipping duplicate short question Q${q.questionNumber} from student submission`);
        }
    });
    
    const processedShortQuestions = uniqueShortQuestions.map(q => {
        return {
            ...q,
            type: 'short',
            section: q.section || 'B'
        };
    });
    
    // Deduplicate answer sheet short questions
    const uniqueAnswerSheetQuestions = [];
    const answerSheetQuestionNumbers = new Set();
    
    (answerSheetResult.shortQuestions || []).forEach(q => {
        if (!answerSheetQuestionNumbers.has(q.questionNumber)) {
            answerSheetQuestionNumbers.add(q.questionNumber);
            uniqueAnswerSheetQuestions.push(q);
        } else {
            console.log(`Skipping duplicate short question Q${q.questionNumber} from answer sheet`);
        }
    });
    
    // Create the final processed data structure
    const processedData = {
        studentSubmission: {
            mcqs: processedStudentMCQs,
            shortQuestions: processedShortQuestions,
            metadata: {
                filename: studentSubmission.filename,
                submissionId: studentSubmission._id,
                submissionDate: studentSubmission.submissionDate
            }
        },
        answerSheet: {
            mcqs: finalAnswerSheetMCQs,
            shortQuestions: uniqueAnswerSheetQuestions,
            metadata: {
                filename: answerSheet.filename,
                examId: answerSheet.examId
            }
        }
    };

    console.log('Processed Data:', processedData);
    return processedData;
};
