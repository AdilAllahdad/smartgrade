import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { 
    DocumentCheckIcon, 
    ArrowLeftIcon, 
    ChartBarIcon,
    DocumentTextIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

export default function StudentResultPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [exam, setExam] = useState(null);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                setLoading(true);
                
                // Fetch the exam details
                const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const examResponse = await fetch(`${API_BASE_URL}/exam-papers/${examId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!examResponse.ok) {
                    throw new Error('Failed to fetch exam details');
                }

                const examData = await examResponse.json();
                setExam(examData);

                // Fetch the student's result for this exam
                const resultResponse = await fetch(`${API_BASE_URL}/student-submissions/result/${examId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!resultResponse.ok) {
                    throw new Error('Failed to fetch result');
                }

                const resultData = await resultResponse.json();
                
                // Check if the result has been evaluated or graded by a teacher
                if (resultData.status !== 'graded' && resultData.status !== 'evaluated') {
                    throw new Error('This exam has not been graded by your teacher yet.');
                }
                
                // If we have an evaluation result ID, fetch the detailed evaluation
                if (resultData.resultId) {
                    try {
                        console.log('Fetching evaluation with ID:', resultData.resultId);
                        const evaluationResponse = await fetch(`${API_BASE_URL}/results/${resultData.resultId}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });
                        
                        if (evaluationResponse.ok) {
                            const evaluationData = await evaluationResponse.json();
                            console.log('Retrieved evaluation data:', evaluationData);
                            
                            // Check if evaluationData has evaluationDetails
                            if (!evaluationData.evaluationDetails) {
                                console.warn('evaluationData is missing evaluationDetails property:', evaluationData);
                            } else {
                                console.log('evaluationDetails found:', evaluationData.evaluationDetails);
                                console.log('MCQ Results:', evaluationData.evaluationDetails.mcqResults);
                                console.log('Short Question Results:', evaluationData.evaluationDetails.shortQuestionResults);
                            }
                            
                            // Merge the evaluation data with the submission data
                            resultData.evaluationResults = evaluationData;
                            
                            // Show notification if this is first time viewing results
                            const lastViewed = localStorage.getItem(`viewed-result-${resultData.resultId}`);
                            if (!lastViewed) {
                                setShowNotification(true);
                                localStorage.setItem(`viewed-result-${resultData.resultId}`, Date.now());
                            }
                        } else {
                            // Handle non-200 responses
                            console.error('Failed to fetch evaluation results:', evaluationResponse.status);
                            const errorText = await evaluationResponse.text();
                            console.error('Error response:', errorText);
                        }
                    } catch (evalError) {
                        console.error('Error fetching evaluation details:', evalError);
                    }
                }
                
                setResult(resultData);
                
            } catch (error) {
                console.error('Error fetching result:', error);
                setError(error.message || 'Failed to load result data');
            } finally {
                setLoading(false);
            }
        };

        if (examId) {
            fetchResult();
        }
    }, [examId]);

    const handleDownloadSubmission = async () => {
        if (!result || !result.submissionUrl) return;
        
        try {
            // Make sure to use the full API URL with the submission path
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
            const response = await fetch(`${API_BASE_URL}/student-submissions/submissions/download/${result._id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to download submission');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = result.filename || 'submission.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading submission:', error);
            alert('Failed to download submission: ' + error.message);
        }
    };

    return (
        <DashboardLayout allowedRoles={['student']}>
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => navigate('/student')}
                    className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-1" />
                    Back to Dashboard
                </button>

                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                        <h1 className="text-2xl font-bold">Exam Result</h1>
                        {!loading && exam && (
                            <p className="mt-2 text-blue-100">{exam.title}</p>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-red-500 bg-red-50">
                            <p className="font-medium">Error: {error}</p>
                            <p className="mt-2">Please try again later or contact support if the problem persists.</p>
                        </div>
                    ) : !result ? (
                        <div className="p-6 text-center">
                            <DocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h2 className="text-xl font-medium text-gray-700 mb-2">No Result Found</h2>
                            <p className="text-gray-500">
                                We couldn't find any result for this exam. If you've already submitted your work, 
                                it might still be under evaluation.
                            </p>
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Result Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
                                        <h3 className="font-medium text-gray-700">Status</h3>
                                    </div>
                                    <div className="ml-7">
                                        {result.evaluationResults ? (
                                            <div>
                                                <div className="text-lg font-semibold text-green-600">Evaluated</div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {result.evaluationResults.gradedAt ? 
                                                        `On ${new Date(result.evaluationResults.gradedAt).toLocaleDateString()}` : 
                                                        'AI evaluation complete'}
                                                </div>
                                            </div>
                                        ) : result.status === 'graded' ? (
                                            <div className="text-lg font-semibold text-green-600">Graded</div>
                                        ) : result.status === 'evaluated' ? (
                                            <div className="text-lg font-semibold text-blue-600">Evaluated</div>
                                        ) : (
                                            <div className="text-lg font-semibold text-yellow-600">Pending Evaluation</div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                                        <h3 className="font-medium text-gray-700">Submission Date</h3>
                                    </div>
                                    <div className="ml-7">
                                        <div className="text-lg font-semibold text-gray-800">
                                            {result.submissionDate ? new Date(result.submissionDate).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {result.submissionDate ? new Date(result.submissionDate).toLocaleTimeString() : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Evaluation Results - Only shown when the result exists */}
                            {result.evaluationResults && (
                                <div className="mb-8">
                                    <div className="border-b pb-2 mb-4">
                                        <h2 className="text-xl font-semibold text-gray-800">Evaluation Results</h2>
                                    </div>
                                    
                                    {/* Debug Information - Only visible in development mode */}
                                    {import.meta.env.DEV && (
                                        <div className="mb-4 p-3 bg-gray-100 rounded border border-gray-200 text-sm">
                                            <details>
                                                <summary className="font-medium cursor-pointer">Debug Info</summary>
                                                <div className="mt-2">
                                                    <p>Has evaluationDetails: {result.evaluationResults.evaluationDetails ? '✅' : '❌'}</p>
                                                    <p>Has MCQ Results: {result.evaluationResults.evaluationDetails?.mcqResults ? `✅ (${result.evaluationResults.evaluationDetails.mcqResults.length})` : '❌'}</p>
                                                    <p>Has Short Answers: {result.evaluationResults.evaluationDetails?.shortQuestionResults ? `✅ (${result.evaluationResults.evaluationDetails.shortQuestionResults.length})` : '❌'}</p>
                                                </div>
                                            </details>
                                        </div>
                                    )}
                                    
                                    {/* Score Summary */}
                                    <div className="bg-blue-50 rounded-lg p-5 mb-6">
                                        <h3 className="font-semibold text-blue-900 mb-3">Score Summary</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                                <div className="text-sm text-gray-500">MCQ Score</div>
                                                <div className="text-xl font-bold text-gray-800">
                                                    {(() => {
                                                        // Calculate MCQ score from evaluationDetails.mcqResults if available
                                                        const mcqResults = result.evaluationResults.evaluationDetails?.mcqResults || [];
                                                        const mcqObtained = mcqResults.reduce((sum, q) => sum + (q.score || 0), 0);
                                                        
                                                        // Use the max of each question's maxScore field or default to 1
                                                        const mcqTotal = mcqResults.reduce((sum, q) => {
                                                            // If maxScore is available, use it, otherwise use 1 point per question
                                                            const maxScore = q.maxScore || 1;
                                                            return sum + maxScore;
                                                        }, 0);
                                                        
                                                        // Normalize the display - don't show obtained > total
                                                        const displayObtained = Math.min(mcqObtained, mcqTotal);
                                                        
                                                        return `${displayObtained} / ${mcqTotal || 1}`;
                                                    })()}
                                                </div>
                                                <div className="text-xs text-blue-600">
                                                    {(() => {
                                                        const mcqResults = result.evaluationResults.evaluationDetails?.mcqResults || [];
                                                        const mcqObtained = mcqResults.reduce((sum, q) => sum + (q.score || 0), 0);
                                                        const mcqTotal = mcqResults.reduce((sum, q) => sum + (q.maxScore || 1), 0);
                                                        
                                                        // Calculate percentage but cap it at 100%
                                                        let percentage = mcqTotal > 0 ? Math.round((mcqObtained / mcqTotal) * 100) : 0;
                                                        percentage = Math.min(percentage, 100);
                                                        
                                                        return `${percentage}%`;
                                                    })()}
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                                <div className="text-sm text-gray-500">Short Answer Score</div>
                                                <div className="text-xl font-bold text-gray-800">
                                                    {(() => {
                                                        // Calculate Short Answer score from evaluationDetails.shortQuestionResults if available
                                                        const shortResults = result.evaluationResults.evaluationDetails?.shortQuestionResults || [];
                                                        const shortObtained = shortResults.reduce((sum, q) => sum + (parseFloat(q.score) || 0), 0);
                                                        
                                                        // Get MCQ total first
                                                        const mcqResults = result.evaluationResults.evaluationDetails?.mcqResults || [];
                                                        const mcqTotal = mcqResults.length;
                                                        
                                                        // Get overall maximum from result.evaluationResults.maxScore
                                                        const overallMaxScore = result.evaluationResults.maxScore || 0;
                                                        
                                                        // Short answer max = overall max - mcq max
                                                        const shortAnswerMax = Math.max(overallMaxScore - mcqTotal, shortResults.length);
                                                        
                                                        // Format to one decimal place if needed
                                                        const formattedObtained = Number.isInteger(shortObtained) 
                                                            ? shortObtained 
                                                            : shortObtained.toFixed(1);
                                                            
                                                        return `${formattedObtained} / ${shortAnswerMax}`;
                                                    })()}
                                                </div>
                                                <div className="text-xs text-green-600">
                                                    {(() => {
                                                        const shortResults = result.evaluationResults.evaluationDetails?.shortQuestionResults || [];
                                                        const shortObtained = shortResults.reduce((sum, q) => sum + (parseFloat(q.score) || 0), 0);
                                                        
                                                        // Calculate max score the same way as above
                                                        const mcqResults = result.evaluationResults.evaluationDetails?.mcqResults || [];
                                                        const mcqTotal = mcqResults.length;
                                                        const overallMaxScore = result.evaluationResults.maxScore || 0;
                                                        const shortAnswerMax = Math.max(overallMaxScore - mcqTotal, shortResults.length);
                                                        
                                                        // Calculate percentage but cap it at 100%
                                                        let percentage = shortAnswerMax > 0 ? Math.round((shortObtained / shortAnswerMax) * 100) : 0;
                                                        // Ensure percentage is not greater than 100%
                                                        percentage = Math.min(percentage, 100);
                                                        
                                                        return `${percentage}%`;
                                                    })()}
                                                </div>
                                            </div>
                                            
                                            <div className="bg-indigo-100 rounded-lg p-3 shadow-sm">
                                                <div className="text-sm font-medium text-indigo-800">Total Score</div>
                                                <div className="text-2xl font-bold text-indigo-900">
                                                    {result.evaluationResults.score} / {result.evaluationResults.maxScore || 100}
                                                </div>
                                                <div className="text-sm font-semibold text-indigo-700">
                                                    {result.evaluationResults.percentage}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Detailed Results */}
                                    <div className="space-y-4">
                                        {/* MCQ Results - Only show if evaluationDetails exists */}
                                        {result.evaluationResults.evaluationDetails && (
                                            <details open>
                                                <summary className="cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-100">
                                                    Multiple Choice Questions {result.evaluationResults.evaluationDetails?.mcqResults ? `(${result.evaluationResults.evaluationDetails.mcqResults.length})` : '(0)'}
                                                </summary>
                                                <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
                                                    {result.evaluationResults.evaluationDetails?.mcqResults?.length > 0 ? (
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q#</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Answer</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct Answer</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {result.evaluationResults.evaluationDetails.mcqResults.map((mcq) => (
                                                                        <tr key={mcq.questionNumber}>
                                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{mcq.questionNumber}</td>
                                                                            <td className="px-4 py-3 text-sm text-gray-500">{mcq.studentAnswer}</td>
                                                                            <td className="px-4 py-3 text-sm text-gray-500">{mcq.correctAnswer}</td>
                                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                                {mcq.isCorrect ? (
                                                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                                        Correct
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                                                        Incorrect
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 text-center py-4 bg-white border border-gray-200 rounded-lg">
                                                            No MCQ results available
                                                        </p>
                                                    )}
                                                </div>
                                            </details>
                                        )}
                                        
                                        {/* Short Answer Results - Only show if evaluationDetails exists */}
                                        {result.evaluationResults.evaluationDetails && (
                                            <details open>
                                                <summary className="cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-100">
                                                    Short Answer Questions {result.evaluationResults.evaluationDetails?.shortQuestionResults ? `(${result.evaluationResults.evaluationDetails.shortQuestionResults.length})` : '(0)'}
                                                </summary>
                                                <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
                                                    {result.evaluationResults.evaluationDetails?.shortQuestionResults?.length > 0 ? (
                                                        result.evaluationResults.evaluationDetails.shortQuestionResults.map((q) => (
                                                            <div key={q.questionNumber} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                                <div className="mb-2">
                                                                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                                                        Question {q.questionNumber}
                                                                    </span>
                                                                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                                                                        Score: {q.score || 0}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="mt-3">
                                                                    <div className="text-sm font-medium text-gray-700">Your Answer:</div>
                                                                    <p className="mt-1 text-sm text-gray-600 p-3 bg-white rounded border border-gray-200">
                                                                        {q.studentAnswer || <em className="text-gray-400">No answer provided</em>}
                                                                    </p>
                                                                </div>
                                                                
                                                                <div className="mt-3">
                                                                    <div className="text-sm font-medium text-gray-700">Model Answer:</div>
                                                                    <p className="mt-1 text-sm text-gray-600 p-3 bg-white rounded border border-gray-200">
                                                                        {q.modelAnswer || <em className="text-gray-400">No model answer provided</em>}
                                                                    </p>
                                                                </div>
                                                                
                                                                {q.feedback && (
                                                                    <div className="mt-3">
                                                                        <div className="text-sm font-medium text-gray-700">Feedback:</div>
                                                                        <p className="mt-1 text-sm text-gray-600 p-3 bg-yellow-50 rounded border border-yellow-100">
                                                                            {q.feedback}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-gray-500 text-center py-4 bg-white border border-gray-200 rounded-lg">
                                                            No short answer results available
                                                        </p>
                                                    )}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Message when results are pending */}
                            {!result.evaluationResults && (
                                <div className="mb-8">
                                    <div className="border-b pb-2 mb-4">
                                        <h2 className="text-xl font-semibold text-gray-800">Results Pending</h2>
                                    </div>
                                    <div className="bg-yellow-50 p-5 rounded-lg text-center border border-yellow-200">
                                        <div className="text-xl font-semibold text-yellow-700 mb-2">
                                            Your exam is being evaluated
                                        </div>
                                        <p className="text-gray-600">
                                            The results will be available once your teacher completes the evaluation.
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {/* Traditional Scoring (if no detailed evaluation results but score exists) */}
                            {!result.evaluationResults && result.score !== undefined && (result.status === 'evaluated' || result.status === 'graded') && (
                                <div className="mb-8">
                                    <div className="border-b pb-2 mb-4">
                                        <h2 className="text-xl font-semibold text-gray-800">Final Score</h2>
                                    </div>
                                    <div className="bg-blue-50 p-5 rounded-lg text-center">
                                        <div className="text-3xl font-bold text-blue-800">
                                            {result.score} / {result.totalMarks || 100}
                                        </div>
                                        <div className="text-sm text-blue-600 mt-1">
                                            {Math.round((result.score / (result.totalMarks || 100)) * 100)}% achieved
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Teacher Feedback */}
                            {result.feedback && (
                                <div className="mb-6">
                                    <div className="border-b pb-2 mb-4">
                                        <h2 className="text-xl font-semibold text-gray-800">Teacher Feedback</h2>
                                    </div>
                                    <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200">
                                        <p className="text-gray-800 whitespace-pre-line">{result.feedback}</p>
                                    </div>
                                </div>
                            )}

                        
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
