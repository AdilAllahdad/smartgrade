// Server API endpoint to save evaluation results
const saveEvaluationResults = async (submissionId, evaluationData) => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        const response = await fetch(`${API_BASE_URL}/evaluate/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                submissionId,
                evaluationData
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save evaluation results');
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving evaluation results:', error);
        throw error;
    }
};

export { saveEvaluationResults };
