/**
 * AI Evaluation Service
 * Handles automatic evaluation of student submissions using AI models
 */

const natural = require('natural');
const stringSimilarity = require('string-similarity');

/**
 * Evaluate MCQ questions
 */
function evaluateMcqs(answerSheet, studentSubmission) {
    const results = [];
    let mcqTotalScore = 0;
    let mcqObtainedScore = 0;

    answerSheet.forEach((ans) => {
        const stu = studentSubmission.find(s => s.questionNumber === ans.questionNumber);
        
        const correctAnswer = ans.correctAnswer || ans.question || '';
        const studentAnswer = stu?.selectedAnswer || '';
        
        const questionMarks = ans.marks || 1;
        mcqTotalScore += questionMarks;

        const correct = String(correctAnswer).trim().toLowerCase() === String(studentAnswer).trim().toLowerCase();
        const obtainedMarks = correct ? questionMarks : 0;
        mcqObtainedScore += obtainedMarks;

        results.push({
            id: ans.questionNumber,
            question: ans.question,
            studentAnswer: studentAnswer,
            correctAnswer: correctAnswer,
            correct: correct,
            marks: questionMarks,
            obtainedMarks: obtainedMarks
        });
    });

    return { results, mcqObtainedScore, mcqTotalScore };
}

/**
 * Extract key concepts from text
 */
function extractKeyConcepts(text) {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those']);
    const tokenizer = new natural.WordTokenizer();
    const words = tokenizer.tokenize(text.toLowerCase());
    
    const keyWords = words.filter(word => 
        word.length >= 3 && 
        !stopWords.has(word) && 
        /^[a-z]+$/.test(word)
    );
    
    return [...new Set(keyWords)];
}

/**
 * Calculate keyword matching score
 */
function calculateKeywordScore(studentAnswer, keyConcepts) {
    if (!keyConcepts || keyConcepts.length === 0) {
        return 0.3;
    }
    
    const studentWords = new Set(extractKeyConcepts(studentAnswer));
    const matchedConcepts = keyConcepts.filter(concept => studentWords.has(concept));
    
    if (matchedConcepts.length === 0) {
        return 0.0;
    }
    
    return Math.min(1.0, matchedConcepts.length / Math.max(3, keyConcepts.length));
}

/**
 * Assess answer relevance to question
 */
function assessRelevance(studentAnswer, teacherAnswer, questionText) {
    const questionKeywords = extractKeyConcepts(questionText);
    const answerKeywords = extractKeyConcepts(studentAnswer);
    
    if (questionKeywords.length === 0) {
        return 0.5;
    }
    
    const relevantKeywords = questionKeywords.filter(kw => answerKeywords.includes(kw));
    const relevanceRatio = relevantKeywords.length / questionKeywords.length;
    
    return Math.min(1.0, relevanceRatio * 1.5);
}

/**
 * Calculate quality score for short answer
 */
function calculateQualityScore(studentAnswer, teacherAnswer, questionText) {
    const studentAnswerLower = studentAnswer.toLowerCase().trim();
    const teacherAnswerLower = teacherAnswer.toLowerCase().trim();
    
    // 1. Check for "I don't know" type answers
    const noKnowledgePhrases = [
        "i don't know", "i don't know", "idk", "no idea", "not sure",
        "cannot answer", "i don't understand", "i have no idea"
    ];
    
    if (noKnowledgePhrases.some(phrase => studentAnswerLower.includes(phrase))) {
        return 0.0;
    }
    
    // 2. Check for extremely short or incomplete answers
    const wordCount = studentAnswer.split(/\s+/).length;
    if (wordCount <= 2) {
        return 0.1;
    }
    
    // 3. Semantic similarity using string similarity
    const similarity = stringSimilarity.compareTwoStrings(teacherAnswerLower, studentAnswerLower);
    
    // 4. Length adequacy
    const minExpectedLength = teacherAnswer.length * 0.3;
    const lengthRatio = studentAnswer.length / teacherAnswer.length;
    
    let lengthPenalty;
    if (studentAnswer.length < minExpectedLength) {
        lengthPenalty = 0.2;
    } else {
        lengthPenalty = Math.min(1.0, lengthRatio);
    }
    
    // 5. Keyword matching
    const keyConcepts = extractKeyConcepts(teacherAnswer);
    const keywordScore = calculateKeywordScore(studentAnswer, keyConcepts);
    
    // 6. Content relevance
    const relevanceScore = assessRelevance(studentAnswer, teacherAnswer, questionText);
    
    // Combine factors with weights
    let finalScore = (
        similarity * 0.4 +
        lengthPenalty * 0.1 +
        keywordScore * 0.3 +
        relevanceScore * 0.2
    );
    
    // Apply additional penalties
    if (wordCount <= 4) {
        finalScore *= 0.3;
    }
    
    // Penalize answers that just repeat the question
    const questionWords = new Set(questionText.toLowerCase().split(/\s+/));
    const answerWords = new Set(studentAnswerLower.split(/\s+/));
    const uniqueAnswerWords = [...answerWords].filter(word => !questionWords.has(word));
    
    if (uniqueAnswerWords.length <= 2) {
        finalScore *= 0.4;
    }
    
    return Math.max(0.0, Math.min(1.0, finalScore));
}

/**
 * Generate feedback for short answer
 */
function generateFeedback(question, correctAnswer, studentAnswer, score) {
    // For very poor answers
    if (score < 0.3) {
        const wordCount = studentAnswer.trim().split(/\s+/).length;
        if (wordCount <= 2) {
            return "Your answer is too brief. Please provide more detailed explanation.";
        } else if (studentAnswer.toLowerCase().includes("don't know") || studentAnswer.toLowerCase().includes("idk")) {
            return "It seems you're unsure about this topic. Please review the relevant concepts.";
        } else {
            return "Your answer doesn't address the key points of the question. Review the topic and try again.";
        }
    }
    
    // For mediocre answers
    if (score < 0.6) {
        const keyPoints = extractKeyConcepts(correctAnswer).slice(0, 3);
        if (keyPoints.length > 0) {
            const missingPoints = keyPoints.filter(point => !studentAnswer.toLowerCase().includes(point));
            if (missingPoints.length > 0) {
                return `Your answer is partially correct but missing key concepts like: ${missingPoints.slice(0, 2).join(', ')}`;
            }
        }
        return "Your answer is on the right track but needs more depth and accuracy.";
    }
    
    // For good answers
    return "Good effort! Your answer covers the main concepts well.";
}

/**
 * Evaluate short answer questions
 */
function evaluateShortAnswers(answerSheet, studentSubmission) {
    const results = [];
    let shortTotalScore = 0;
    let shortObtainedScore = 0;

    answerSheet.forEach((ans) => {
        const questionNum = ans.questionNumber;
        const studentAnswerObj = studentSubmission.find(stu => stu.questionNumber === questionNum);
        
        const questionMarks = ans.marks || 5;
        shortTotalScore += questionMarks;

        if (studentAnswerObj) {
            const teacherAnswer = ans.correctAnswer || ans.question || '';
            const actualQuestion = studentAnswerObj.question || '';
            const studentAnswer = studentAnswerObj.answer || studentAnswerObj.selectedAnswer || '';

            let score = 0;
            let feedback = '';

            if (studentAnswer.trim()) {
                const qualityScore = calculateQualityScore(studentAnswer, teacherAnswer, actualQuestion);
                score = Math.round(qualityScore * questionMarks * 100) / 100;
                shortObtainedScore += score;
                
                feedback = generateFeedback(actualQuestion, teacherAnswer, studentAnswer, qualityScore);
            } else {
                feedback = "No answer provided by student";
            }

            results.push({
                id: questionNum,
                question: actualQuestion,
                studentAnswer: studentAnswer,
                correctAnswer: teacherAnswer,
                marks: questionMarks,
                obtainedMarks: score,
                feedback: feedback
            });
        } else {
            const teacherAnswer = ans.correctAnswer || ans.question || '';
            const actualQuestion = studentSubmission.find(stu => stu.questionNumber === questionNum)?.question || '';

            results.push({
                id: questionNum,
                question: actualQuestion,
                studentAnswer: '',
                correctAnswer: teacherAnswer,
                marks: questionMarks,
                obtainedMarks: 0,
                feedback: "No answer provided by student"
            });
        }
    });

    return { results, shortObtainedScore, shortTotalScore };
}

/**
 * Main evaluation function
 */
async function evaluateSubmission(data) {
    console.log('Starting evaluation...');
    
    // Evaluate MCQs
    const mcqEval = evaluateMcqs(
        data.answerSheet.mcqs,
        data.studentSubmission.mcqs
    );
    
    // Evaluate short questions
    const shortEval = evaluateShortAnswers(
        data.answerSheet.shortQuestions,
        data.studentSubmission.shortQuestions || []
    );
    
    const totalObtained = mcqEval.mcqObtainedScore + shortEval.shortObtainedScore;
    const totalMarks = mcqEval.mcqTotalScore + shortEval.shortTotalScore;
    
    const result = {
        mcqResults: mcqEval.results,
        shortQuestionResults: shortEval.results,
        scoreSummary: {
            mcqObtained: Math.round(mcqEval.mcqObtainedScore * 100) / 100,
            mcqTotal: mcqEval.mcqTotalScore,
            shortObtained: Math.round(shortEval.shortObtainedScore * 100) / 100,
            shortTotal: shortEval.shortTotalScore,
            totalObtained: Math.round(totalObtained * 100) / 100,
            totalMarks: totalMarks
        }
    };
    
    console.log('Evaluation completed');
    return result;
}

module.exports = {
    evaluateSubmission
};
