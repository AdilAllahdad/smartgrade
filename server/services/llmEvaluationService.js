/**
 * LLM-Based Evaluation Service
 * Uses Hugging Face models for advanced semantic evaluation
 * Converted from Python implementation to JavaScript
 */

const { HfInference } = require('@huggingface/inference');
const stringSimilarity = require('string-similarity');

// ==============================
// Configuration
// ==============================
const HF_API_TOKEN = process.env.HUGGINGFACE_API_KEY || null;
const USE_CACHED_RESULTS = true;
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Initialize Hugging Face client
let hfClient = null;
if (HF_API_TOKEN) {
    hfClient = new HfInference(HF_API_TOKEN);
    console.log('✓ Hugging Face LLM client initialized');
} else {
    console.warn('⚠ HUGGINGFACE_API_KEY not found - LLM evaluation will use fallback mode');
}

// Cache for embeddings to reduce API calls
const embeddingCache = new Map();
const feedbackCache = new Map(); // Cache for AI-generated feedback

// ==============================
// Helper Functions
// ==============================

/**
 * Generate AI-powered feedback using Hugging Face LLM
 */
async function generateAIFeedback(question, correctAnswer, studentAnswer, qualityScore) {
    if (!hfClient) {
        console.log('No HF client - using template feedback');
        return generateIntelligentFeedback(question, correctAnswer, studentAnswer, qualityScore);
    }

    // Check cache
    const cacheKey = `${question}_${studentAnswer}_${correctAnswer}`.substring(0, 100);
    if (USE_CACHED_RESULTS && feedbackCache.has(cacheKey)) {
        return feedbackCache.get(cacheKey);
    }

    try {
        // Extract what's missing from the student answer
        const correctKeywords = extractKeyConcepts(correctAnswer);
        const studentKeywords = new Set(extractKeyConcepts(studentAnswer));
        const missingConcepts = correctKeywords.filter(kw => !studentKeywords.has(kw));

        // Build a more focused prompt
        let prompt;
        if (qualityScore < 0.5) {
            // For weak answers, be specific about what's missing
            prompt = `Student was asked: "${question}"
Correct answer should mention: ${correctAnswer}
Student wrote: "${studentAnswer}"
Missing concepts: ${missingConcepts.slice(0, 4).join(', ')}

Provide one clear sentence telling the student what specific information they need to add. Start with "Your answer" or "You need to":`;
        } else if (qualityScore < 0.7) {
            // For decent answers, suggest improvements
            prompt = `Student was asked: "${question}"
Student wrote: "${studentAnswer}"
This answer is ${Math.round(qualityScore * 100)}% correct.

Provide one encouraging sentence about what they could add to improve. Start with "Good" or "You're on the right track":`;
        } else {
            // For good answers, be positive
            prompt = `Student answered: "${studentAnswer}" and got ${Math.round(qualityScore * 100)}% score.

Provide one positive sentence. Start with "Excellent" or "Very good" or "Well done":`;
        }

        console.log('Generating AI feedback with HF...');
        const response = await Promise.race([
            hfClient.textGeneration({
                model: 'mistralai/Mistral-7B-Instruct-v0.2',
                inputs: prompt,
                parameters: {
                    max_new_tokens: 80,
                    temperature: 0.6,
                    top_p: 0.85,
                    return_full_text: false,
                    do_sample: true
                }
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 15000)
            )
        ]);

        let feedback = response.generated_text.trim();
        
        // Clean up the feedback
        feedback = feedback.split('\n')[0]; // Take first line only
        feedback = feedback.replace(/^(Feedback:|Teacher:|Response:|Answer:)\s*/i, '');
        feedback = feedback.replace(/^["']|["']$/g, ''); // Remove quotes
        
        // Ensure feedback isn't too long
        if (feedback.length > 220) {
            feedback = feedback.substring(0, 217) + '...';
        }

        // Validate feedback quality
        if (feedback.length < 15 || 
            feedback.toLowerCase().includes('undefined') ||
            feedback.toLowerCase().includes('student answer') ||
            !feedback.match(/[a-z]{3,}/i)) {
            console.log('AI feedback quality check failed, using template');
            feedback = generateIntelligentFeedback(question, correctAnswer, studentAnswer, qualityScore);
        } else {
            console.log('AI feedback generated successfully');
        }

        // Cache the result
        if (USE_CACHED_RESULTS) {
            feedbackCache.set(cacheKey, feedback);
        }

        return feedback;
    } catch (error) {
        console.error('Error generating AI feedback:', error.message);
        // Fallback to enhanced template-based feedback
        return generateIntelligentFeedback(question, correctAnswer, studentAnswer, qualityScore);
    }
}

// ==============================

/**
 * Extract key concepts from text
 */
function extractKeyConcepts(text) {
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but',
        'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'this',
        'that', 'these', 'those', 'will', 'can', 'could', 'should', 'would'
    ]);

    const words = (text || '').toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
    const keyWords = words.filter(word => !stopWords.has(word));

    // Remove duplicates while preserving order
    return [...new Set(keyWords)];
}

/**
 * Calculate keyword overlap between answers
 */
function calculateKeywordOverlap(studentAnswer, correctAnswer) {
    const studentKeywords = new Set(extractKeyConcepts(studentAnswer));
    const correctKeywords = new Set(extractKeyConcepts(correctAnswer));

    if (correctKeywords.size === 0) {
        return 0.7; // Increased default from 0.5
    }

    // Exact match score
    const exactOverlap = [...studentKeywords].filter(kw => correctKeywords.has(kw)).length;
    
    // Partial match score (checking if keywords contain each other)
    let partialMatches = 0;
    for (const studentKw of studentKeywords) {
        for (const correctKw of correctKeywords) {
            if (studentKw.includes(correctKw) || correctKw.includes(studentKw)) {
                partialMatches += 0.7; // Increased from 0.5 to 0.7 for partial matches
                break;
            }
        }
    }
    
    const totalMatches = exactOverlap + partialMatches;
    const score = totalMatches / correctKeywords.size;
    
    // Be very generous with scaling
    return Math.min(1.0, score * 1.3); // Increased from 1.2 to 1.3
}

/**
 * Assess answer completeness
 */
function assessAnswerCompleteness(studentAnswer, correctAnswer) {
    const studentLen = studentAnswer.split(/\s+/).length;
    const correctLen = correctAnswer.split(/\s+/).length;

    if (studentLen < 3) {
        return 0.4; // Increased from 0.3
    }

    // Very reduced minimum expected - only 15%
    const minExpected = correctLen * 0.15;

    if (studentLen < minExpected) {
        // Minimal penalty - increased from 0.75 to 0.85
        return Math.min(1.0, studentLen / minExpected) * 0.85;
    }

    // Give full credit for answers between 15% and 200% of expected length
    // This rewards concise answers heavily
    if (studentLen <= correctLen * 2.0) {
        return 1.0;
    }

    // Very minimal penalty for verbose answers
    return 0.95;
}

/**
 * Get semantic embedding using Hugging Face API
 */
async function getEmbedding(text) {
    if (!hfClient) {
        // Fallback: return simple character-based hash as pseudo-embedding
        return text.toLowerCase().split('').map((c, i) => c.charCodeAt(0) * (i + 1));
    }

    // Check cache
    const cacheKey = text.trim().toLowerCase();
    if (USE_CACHED_RESULTS && embeddingCache.has(cacheKey)) {
        return embeddingCache.get(cacheKey);
    }

    try {
        // Use sentence-transformers model via Hugging Face Inference API
        const response = await hfClient.featureExtraction({
            model: 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2',
            inputs: text
        });

        const embedding = Array.isArray(response) ? response : [response];
        
        // Cache the result
        if (USE_CACHED_RESULTS) {
            embeddingCache.set(cacheKey, embedding);
        }

        return embedding;
    } catch (error) {
        console.error('Error getting embedding:', error.message);
        // Fallback to simple representation
        return text.toLowerCase().split('').map((c, i) => c.charCodeAt(0) * (i + 1));
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        return 0.1;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate semantic similarity between two texts
 */
async function calculateSemanticSimilarity(text1, text2) {
    try {
        const [emb1, emb2] = await Promise.all([
            getEmbedding(text1),
            getEmbedding(text2)
        ]);

        // Flatten embeddings if nested
        const flatEmb1 = Array.isArray(emb1[0]) ? emb1[0] : emb1;
        const flatEmb2 = Array.isArray(emb2[0]) ? emb2[0] : emb2;

        return cosineSimilarity(flatEmb1, flatEmb2);
    } catch (error) {
        console.error('Error calculating semantic similarity:', error.message);
        // Fallback to string similarity
        return stringSimilarity.compareTwoStrings(
            text1.toLowerCase(),
            text2.toLowerCase()
        );
    }
}

/**
 * Calculate comprehensive quality score
 */
async function calculateQualityScore(studentAnswer, correctAnswer, questionText) {
    const studentAnswerLower = studentAnswer.toLowerCase().trim();
    const correctAnswerLower = correctAnswer.toLowerCase().trim();

    // 1. Check for non-answers
    const noKnowledgePhrases = [
        "i don't know", "idk", "no idea", "not sure", "cannot answer",
        "i don't understand", "i have no idea", "don't know", "no clue"
    ];

    if (noKnowledgePhrases.some(phrase => studentAnswerLower.includes(phrase))) {
        return 0.0;
    }

    // 2. Check for empty or extremely short answers
    const wordCount = studentAnswer.split(/\s+/).length;
    if (wordCount < 3) {
        return 0.05;
    }

    // 3. Check if student just repeated the question
    const questionWords = new Set(extractKeyConcepts(questionText));
    const answerWords = new Set(extractKeyConcepts(studentAnswer));
    const uniqueAnswerWords = [...answerWords].filter(word => !questionWords.has(word));

    if (uniqueAnswerWords.length < 2) {
        return 0.1;
    }

    // 4. Calculate semantic similarity (using HF or fallback)
    let semanticSimilarity;
    if (hfClient) {
        semanticSimilarity = await calculateSemanticSimilarity(studentAnswer, correctAnswer);
    } else {
        // Fallback to string similarity
        semanticSimilarity = stringSimilarity.compareTwoStrings(
            studentAnswerLower,
            correctAnswerLower
        );
    }

    // 5. Keyword overlap
    const keywordScore = calculateKeywordOverlap(studentAnswer, correctAnswer);

    // 6. Answer completeness
    const completenessScore = assessAnswerCompleteness(studentAnswer, correctAnswer);

    // 7. Question relevance
    let answerRelevance;
    if (hfClient) {
        answerRelevance = await calculateSemanticSimilarity(questionText, studentAnswer);
    } else {
        answerRelevance = 0.5;
    }

    // Weighted combination (balanced approach favoring understanding)
    let finalScore = (
        semanticSimilarity * 0.25 +    // Semantic similarity (reduced)
        keywordScore * 0.45 +           // Keyword matching (MOST important - increased)
        completenessScore * 0.15 +      // Length/completeness (reduced weight)
        answerRelevance * 0.15          // Relevance to question
    );

    // Strong boost if student demonstrates clear understanding
    if (semanticSimilarity > 0.7 || keywordScore > 0.7) {
        finalScore *= 1.25; // 25% bonus for strong understanding
    } else if (semanticSimilarity > 0.6 || keywordScore > 0.6) {
        finalScore *= 1.20; // 20% bonus for good understanding
    } else if (semanticSimilarity > 0.5 || keywordScore > 0.5) {
        finalScore *= 1.15; // 15% bonus for decent understanding
    }

    // Extra boost for near-perfect answers
    if (semanticSimilarity > 0.85 && keywordScore > 0.75) {
        finalScore = Math.min(1.0, finalScore * 1.15); // Additional 15% for excellence
    }

    // Apply minimal penalties only for clearly inadequate answers
    if (wordCount < 4 && keywordScore < 0.25) {
        // Only penalize extremely short answers that lack key concepts
        finalScore *= 0.8;
    }

    if (keywordScore < 0.1 && semanticSimilarity < 0.2) {
        // Only penalize when both metrics are extremely low
        finalScore *= 0.85;
    }

    return Math.max(0.0, Math.min(1.0, finalScore));
}

/**
 * Generate intelligent feedback (enhanced template-based)
 */
function generateIntelligentFeedback(question, correctAnswer, studentAnswer, score) {
    const correctKeywords = extractKeyConcepts(correctAnswer);
    const studentKeywords = new Set(extractKeyConcepts(studentAnswer));
    const missing = correctKeywords.filter(kw => !studentKeywords.has(kw));
    const wordCount = studentAnswer.trim().split(/\s+/).length;

    // For very poor answers (< 25%)
    if (score < 0.25) {
        if (wordCount < 3) {
            return "Your answer is too brief. Please provide a complete explanation with specific details about " + missing.slice(0, 3).join(', ') + ".";
        } else if (["don't know", "idk", "no idea"].some(phrase => studentAnswer.toLowerCase().includes(phrase))) {
            return "Please review the material on " + missing.slice(0, 3).join(', ') + " and provide a substantive answer.";
        } else if (missing.length >= 4) {
            return `Your answer doesn't address the key concepts. You need to explain: ${missing.slice(0, 4).join(', ')}. Review these topics and try again.`;
        } else if (missing.length > 0) {
            return `Your answer is missing critical information about: ${missing.join(', ')}. Make sure to cover these points.`;
        }
        return "Your answer doesn't match the expected content. Review the topic and include the main concepts.";
    }

    // For weak answers (25-50%)
    if (score < 0.5) {
        if (missing.length >= 3) {
            return `You have the right idea, but you're missing several key points: ${missing.slice(0, 3).join(', ')}. Add explanations for these concepts.`;
        } else if (missing.length > 0) {
            return `Good start! To improve your score, make sure to also mention: ${missing.join(', ')}. These are important parts of the answer.`;
        } else if (wordCount < 8) {
            return "Your answer is on track but too brief. Expand with more details and specific examples about the concepts you mentioned.";
        }
        return "Your answer shows basic understanding but lacks detail. Add more specific information and examples.";
    }

    // For decent answers (50-70%)
    if (score < 0.70) {
        if (missing.length >= 2) {
            return `Good answer! You could strengthen it by also discussing: ${missing.slice(0, 2).join(' and ')}. These would complete your response.`;
        } else if (missing.length === 1) {
            return `Good answer! For a complete response, also mention: ${missing[0]}. Otherwise, well done!`;
        }
        return "Good effort! Your answer covers the main concepts. Consider adding more specific details or examples.";
    }

    // For good answers (70-85%)
    if (score < 0.85) {
        if (missing.length > 0) {
            return `Very good! Your answer is strong. For perfection, you could briefly touch on: ${missing.join(', ')}.`;
        }
        return "Very good answer! You demonstrate solid understanding of the concept. Well done!";
    }

    // For excellent answers (85%+)
    return "Excellent answer! You've demonstrated comprehensive understanding with good clarity and detail.";
}

// ==============================
// Main Evaluation Functions
// ==============================

/**
 * Evaluate MCQ questions
 */
function evaluateMcqs(answerSheet, studentSubmission) {
    const results = [];
    let mcqTotalScore = 0;
    let mcqObtainedScore = 0;

    answerSheet.forEach((ans) => {
        const questionNum = ans.questionNumber;
        const correctAnswer = (ans.correctAnswer || '').toString().trim();
        const questionText = ans.question || '';
        const questionMarks = ans.marks || 1;

        mcqTotalScore += questionMarks;

        const studentObj = studentSubmission.find(stu => stu.questionNumber === questionNum);
        const studentAnswer = studentObj ? (studentObj.selectedAnswer || '').toString().trim() : '';

        const correct = studentAnswer.toLowerCase() === correctAnswer.toLowerCase();
        const obtainedMarks = correct ? questionMarks : 0;
        mcqObtainedScore += obtainedMarks;

        results.push({
            id: questionNum,
            question: questionText,
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
 * Evaluate short answer questions using LLM
 */
async function evaluateShortAnswers(answerSheet, studentSubmission) {
    const results = [];
    let shortTotalScore = 0;
    let shortObtainedScore = 0;

    console.log('LLM evaluateShortAnswers - Answer sheet sample:', JSON.stringify(answerSheet.slice(0, 2), null, 2));
    console.log('LLM evaluateShortAnswers - Student submission sample:', JSON.stringify(studentSubmission.slice(0, 2), null, 2));

    // Process questions sequentially to avoid rate limiting
    for (const ans of answerSheet) {
        const questionNum = ans.questionNumber;
        // Try multiple fields to get the correct answer (match standard evaluation behavior)
        const correctAnswer = ans.correctAnswer || ans.answer || ans.question || '';
        const questionMarks = ans.marks || 5;

        console.log(`Q${questionNum}: correctAnswer="${correctAnswer}" (from ans.correctAnswer="${ans.correctAnswer}", ans.answer="${ans.answer}")`);

        shortTotalScore += questionMarks;

        const studentObj = studentSubmission.find(stu => stu.questionNumber === questionNum);

        if (studentObj) {
            const questionText = studentObj.question || '';
            const studentAnswer = studentObj.answer || studentObj.selectedAnswer || '';

            if (studentAnswer.trim()) {
                try {
                    // Calculate quality score using LLM
                    const qualityScore = await calculateQualityScore(
                        studentAnswer,
                        correctAnswer,
                        questionText
                    );

                    const obtainedMarks = Math.round(qualityScore * questionMarks * 100) / 100;
                    shortObtainedScore += obtainedMarks;

                    // Generate AI-powered feedback
                    const feedback = await generateAIFeedback(
                        questionText,
                        correctAnswer,
                        studentAnswer,
                        qualityScore
                    );

                    results.push({
                        id: questionNum,
                        question: questionText,
                        studentAnswer: studentAnswer,
                        correctAnswer: correctAnswer,
                        marks: questionMarks,
                        obtainedMarks: obtainedMarks,
                        feedback: feedback,
                        qualityScore: Math.round(qualityScore * 100 * 10) / 10
                    });
                } catch (error) {
                    console.error(`Error evaluating question ${questionNum}:`, error.message);
                    // Fallback to simple scoring
                    results.push({
                        id: questionNum,
                        question: questionText,
                        studentAnswer: studentAnswer,
                        correctAnswer: correctAnswer,
                        marks: questionMarks,
                        obtainedMarks: 0,
                        feedback: "Evaluation error - please review manually.",
                        qualityScore: 0
                    });
                }
            } else {
                results.push({
                    id: questionNum,
                    question: questionText,
                    studentAnswer: '',
                    correctAnswer: correctAnswer,
                    marks: questionMarks,
                    obtainedMarks: 0,
                    feedback: "No answer provided.",
                    qualityScore: 0
                });
            }
        } else {
            results.push({
                id: questionNum,
                question: '',
                studentAnswer: '',
                correctAnswer: correctAnswer,
                marks: questionMarks,
                obtainedMarks: 0,
                feedback: "Question not attempted.",
                qualityScore: 0
            });
        }
    }

    return { results, shortObtainedScore, shortTotalScore };
}

/**
 * Main evaluation function
 */
async function evaluateSubmission(data) {
    console.log('Starting LLM-based evaluation...');

    // Evaluate MCQs
    const mcqEval = evaluateMcqs(
        data.answerSheet.mcqs || [],
        data.studentSubmission.mcqs || []
    );

    // Evaluate short questions with LLM
    const shortEval = await evaluateShortAnswers(
        data.answerSheet.shortQuestions || [],
        data.studentSubmission.shortQuestions || []
    );

    const totalObtained = mcqEval.mcqObtainedScore + shortEval.shortObtainedScore;
    const totalMarks = mcqEval.mcqTotalScore + shortEval.shortTotalScore;
    const percentage = totalMarks > 0 ? Math.round((totalObtained / totalMarks * 100) * 100) / 100 : 0;

    const result = {
        mcqResults: mcqEval.results,
        shortQuestionResults: shortEval.results,
        scoreSummary: {
            mcqObtained: Math.round(mcqEval.mcqObtainedScore * 100) / 100,
            mcqTotal: mcqEval.mcqTotalScore,
            shortObtained: Math.round(shortEval.shortObtainedScore * 100) / 100,
            shortTotal: shortEval.shortTotalScore,
            totalObtained: Math.round(totalObtained * 100) / 100,
            totalMarks: totalMarks,
            percentage: percentage,
            grade: calculateGrade(percentage)
        },
        metadata: {
            evaluationMethod: hfClient ? 'LLM-Enhanced' : 'LLM-Fallback',
            models: hfClient ? ['paraphrase-multilingual-mpnet-base-v2'] : ['string-similarity']
        }
    };

    console.log('LLM evaluation completed');
    return result;
}

/**
 * Calculate letter grade from percentage
 */
function calculateGrade(percentage) {
    if (percentage >= 90) return "A+";
    if (percentage >= 85) return "A";
    if (percentage >= 80) return "A-";
    if (percentage >= 75) return "B+";
    if (percentage >= 70) return "B";
    if (percentage >= 65) return "B-";
    if (percentage >= 60) return "C+";
    if (percentage >= 55) return "C";
    if (percentage >= 50) return "C-";
    return "F";
}

module.exports = {
    evaluateSubmission,
    evaluateShortAnswers,
    evaluateMcqs,
    calculateQualityScore,
    isLLMEnabled: () => hfClient !== null
};
