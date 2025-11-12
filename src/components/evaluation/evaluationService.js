import React from 'react';

/**
 * Sends evaluation data to the AI model API
 * 
 * @param {Object} processedData - The processed student and answer sheet data
 * @param {Function} onSuccess - Callback when API call succeeds
 * @param {Function} onError - Callback when API call fails
 */
export const sendEvaluationToApi = async (processedData, onSuccess, onError) => {
    try {
        // Get the ngrok URL from your LLM service
        // NOTE: You need to update this URL with your actual ngrok URL each time you start the service
        const ngrokUrl = sessionStorage.getItem('llmApiUrl') || import.meta.env.VITE_LLM_API_URL || prompt('Please enter the LLM API URL from your ngrok tunnel:');
        
        // Store the URL for future use
        if (ngrokUrl) {
            sessionStorage.setItem('llmApiUrl', ngrokUrl);
        }
        
        const API_BASE = ngrokUrl;
        console.log('Sending data to:', `${API_BASE}/evaluate`);
        
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

        // Send data to the LLM API with proper CORS handling
        const response = await fetch(`${API_BASE}/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(processedData)
        });
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}: ${response.statusText}`);
        }
        
        // Parse the actual response from the LLM API
        const evaluationResults = await response.json();
        console.log('Received evaluation results:', evaluationResults);
        
        // Call success callback with the actual results
        if (onSuccess) {
            onSuccess(evaluationResults);
        }
        
        console.log('Evaluation data processed by LLM model');
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
