import React from 'react';

/**
 * Sends evaluation data to the AI model API
 * 
 * @param {Object} processedData - The processed student and answer sheet data
 * @param {string} evaluationMode - The evaluation mode: 'standard' or 'llm'
 * @param {Function} onSuccess - Callback when API call succeeds
 * @param {Function} onError - Callback when API call fails
 */
export const sendEvaluationToApi = async (processedData, evaluationMode, onSuccess, onError) => {
    try {
        // Use the backend API URL instead of external ngrok URL
        const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`;
        
        console.log('Sending data to:', `${API_BASE_URL}/evaluate`);
        console.log('Evaluation Mode:', evaluationMode);
        
        // Ensure marks are included in all questions for evaluation
        if (processedData.answerSheet && processedData.answerSheet.mcqs) {
            processedData.answerSheet.mcqs.forEach(mcq => {
                if (mcq.marks === undefined || mcq.marks === null) {
                    // Default to 1 mark per MCQ if not specified
                    mcq.marks = 1;
                }
            });
        }
        
        if (processedData.answerSheet && processedData.answerSheet.shortQuestions) {
            processedData.answerSheet.shortQuestions.forEach(q => {
                if (q.marks === undefined || q.marks === null) {
                    // Default to 5 marks per short question if not specified
                    q.marks = 5;
                }
            });
        }
        
        console.log('Data being sent (with marks):', processedData);

        // Send data to the backend API with evaluation mode
        const response = await fetch(`${API_BASE_URL}/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                ...processedData,
                evaluationMode: evaluationMode // Include the evaluation mode
            })
        });
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}: ${response.statusText}`);
        }
        
        // Parse the actual response from the backend
        const evaluationResults = await response.json();
        console.log('Received evaluation results:', evaluationResults);
        
        // Call success callback with the actual results
        if (onSuccess) {
            onSuccess(evaluationResults);
        }
        
        console.log('Evaluation data processed by AI model');
    } catch (error) {
        console.error('API error:', error);
        if (onError) {
            onError(error.message);
        }
    }
};

/**
 * Starts a countdown timer for the evaluation process
 * 
 * @param {number} initialTime - Initial countdown time in seconds
 * @param {Function} onTick - Callback for each second change
 * @param {Function} onComplete - Callback when countdown reaches zero
 * @returns {Function} - Function to clear the timer
 */
export const startEvaluationCountdown = (initialTime, onTick, onComplete) => {
    const timer = setInterval(() => {
        onTick((prev) => {
            if (prev <= 1) {
                clearInterval(timer);
                setTimeout(() => {
                    if (onComplete) {
                        onComplete();
                    }
                }, 1000);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    
    // Return a function to clear the timer if needed
    return () => clearInterval(timer);
};
