import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

// Import sub-components
import DocumentViewer from './evaluation/DocumentViewer';
import LoadingIndicator from './evaluation/LoadingIndicator';
import ErrorDisplay from './evaluation/ErrorDisplay';
import McqSummary from './evaluation/McqSummary';
import ShortAnswerSummary from './evaluation/ShortAnswerSummary';
import ProcessedDataDisplay from './evaluation/ProcessedDataDisplay';
import EvaluationResults from './evaluation/EvaluationResults';
import EvaluationLoadingModal from './evaluation/EvaluationLoadingModal';

// Import document processing functions
import { processDocument } from './evaluation/documentProcessing';
import { sendEvaluationToApi } from './evaluation/evaluationService';
import { processDocumentsForEvaluation } from './evaluation/evaluationProcessor';
import { saveEvaluationResults } from './evaluation/saveEvaluationService';

const EvaluationModal = ({ isOpen, onClose, onEvaluationSaved, studentSubmission, examId }) => {
    const [answerSheet, setAnswerSheet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [countdown, setCountdown] = useState(30); // Increased time for LLM processing
    const [evaluationMode, setEvaluationMode] = useState('standard'); // 'standard' or 'llm'
    const [processedData, setProcessedData] = useState({
        studentSubmission: {
            mcqs: [],
            shortQuestions: [],
            metadata: {}
        },
        answerSheet: {
            mcqs: [],
            shortQuestions: [],
            metadata: {}
        },
        evaluationResults: null // Will store AI evaluation results from LLM
    });

    useEffect(() => {
        if (isOpen && examId) {
            fetchAnswerSheet();
        }
    }, [isOpen, examId]);

    // All document processing functions have been moved to documentProcessing.js

    const fetchAnswerSheet = async () => {
        try {
            setLoading(true);
            setError(null); // Reset error state
            
            console.log('Fetching exam details for examId:', examId);
            
            // Get the API base URL from environment or fallback to a default
            const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`;
            
            // Get the exam paper details which includes the answer sheets
            const examResponse = await fetch(`${API_BASE_URL}/exam-papers/${examId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                // Add error handling for network issues
                signal: AbortSignal.timeout(10000) // 10 second timeout
            }).catch(err => {
                console.error('Network error when fetching exam details:', err);
                throw new Error('Network error. Please check if server is running.');
            });

            if (!examResponse.ok) {
                throw new Error(`Failed to fetch exam details. Status: ${examResponse.status}`);
            }

            const examData = await examResponse.json();
            console.log('Exam data:', examData);

            // Check for answer sheets in the response
            if (!examData.answerSheets || examData.answerSheets.length === 0) {
                throw new Error('No answer sheet available for this exam');
            }

            // Use the first answer sheet
            const answerSheetData = examData.answerSheets[0];
            console.log('Answer sheet data:', answerSheetData);

            // Set the answer sheet data with the download URL from the response
            // Make sure we use a complete URL including the domain
            const downloadUrl = answerSheetData.downloadUrl.startsWith('http') 
                ? answerSheetData.downloadUrl 
                : `${API_BASE_URL.split('/api')[0]}${answerSheetData.downloadUrl}`;
                
            setAnswerSheet({
                _id: answerSheetData._id,
                filename: answerSheetData.filename,
                downloadUrl: downloadUrl,
                fileUrl: downloadUrl // Add fileUrl to be consistent with studentSubmission
            });
        } catch (err) {
            setError(err.message || 'Failed to load answer sheet');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-2 sm:top-5 mx-2 sm:mx-auto p-3 sm:p-5 border w-auto sm:w-11/12 lg:w-4/5 max-w-5xl shadow-lg rounded-md sm:rounded-lg bg-white mb-4">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-xl lg:text-2xl font-semibold text-gray-900">Evaluate Submission</h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 p-1 sm:p-0"
                        >
                            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {/* Student Submission */}
                    <div className="border rounded-lg p-3 sm:p-4">
                        <h4 className="font-semibold text-sm sm:text-base mb-2 sm:mb-4">Student's Submission</h4>
                        <div className="h-[300px] sm:h-[400px] lg:h-[600px] overflow-y-auto">
                            <DocumentViewer document={studentSubmission} title="Student Submission" />
                        </div>
                    </div>

                    {/* Answer Sheet */}
                    <div className="border rounded-lg p-3 sm:p-4">
                        <h4 className="font-semibold text-sm sm:text-base mb-2 sm:mb-4">Official Answer Sheet</h4>
                        {loading ? (
                            <LoadingIndicator />
                        ) : error ? (
                            <ErrorDisplay message={error} retry={fetchAnswerSheet} />
                        ) : (
                            <div className="h-[300px] sm:h-[400px] lg:h-[600px] overflow-y-auto">
                                <DocumentViewer document={answerSheet} title="Answer Sheet" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Evaluation Results from LLM Model */}
                {processedData.evaluationResults && (
                    <div className="relative">
                        <EvaluationResults results={processedData.evaluationResults} />
                        
                        {/* Confirm Results Button */}
                        {processedData.evaluationResults && !saveSuccess && (
                            <div className="mt-3 sm:mt-4 flex justify-center">
                                <button
                                    onClick={async () => {
                                        if (!studentSubmission?._id) {
                                            setError("Student submission ID is missing");
                                            return;
                                        }
                                        
                                        try {
                                            setIsSaving(true);
                                            // Save the evaluation results to the database
                                            const saveResponse = await saveEvaluationResults(
                                                studentSubmission._id,
                                                processedData.evaluationResults
                                            );
                                            
                                            // Store notification status for display
                                            setProcessedData(prev => ({
                                                ...prev,
                                                notificationStatus: saveResponse.notification
                                            }));
                                            
                                            setSaveSuccess(true);
                                            
                                            // Call the callback to refresh parent component data
                                            if (onEvaluationSaved) {
                                                onEvaluationSaved();
                                            }
                                            
                                            // Log notification status
                                            if (saveResponse.notification?.sent) {
                                                console.log('✓ Guardian notification:', saveResponse.notification.message);
                                                if (saveResponse.notification.details) {
                                                    console.log('  Details:', saveResponse.notification.details);
                                                }
                                            } else {
                                                console.warn('⚠ Guardian notification:', saveResponse.notification?.message);
                                            }
                                            
                                            // Show success message for 3 seconds before closing
                                            setTimeout(() => {
                                                onClose();
                                            }, 3000);
                                        } catch (error) {
                                            setError(`Failed to save results: ${error.message}`);
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving || saveSuccess}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center space-x-2 shadow-md text-sm sm:text-base"
                                >
                                    {isSaving ? (
                                        <>
                                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : saveSuccess ? (
                                        <>
                                            <CheckCircleIcon className="h-5 w-5" />
                                            <span>Saved Successfully!</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="h-5 w-5" />
                                            <span>Confirm & Save Evaluation</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                        
                        {/* Success Message */}
                        {saveSuccess && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded p-2">
                                <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg shadow-lg border border-green-200 max-w-md mx-2">
                                    <CheckCircleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-lg sm:text-xl font-semibold text-green-700 mb-2">Evaluation Saved!</h3>
                                    <p className="text-sm sm:text-base text-green-600 mb-3">Results are now available to the student.</p>
                                    
                                    {/* Notification Status */}
                                    {processedData.notificationStatus && (
                                        <div className={`mt-3 p-2 sm:p-3 rounded-lg ${
                                            processedData.notificationStatus.sent 
                                                ? 'bg-blue-50 border border-blue-200' 
                                                : 'bg-yellow-50 border border-yellow-200'
                                        }`}>
                                            <p className={`text-xs sm:text-sm font-medium ${
                                                processedData.notificationStatus.sent 
                                                    ? 'text-blue-700' 
                                                    : 'text-yellow-700'
                                            }`}>
                                                📱 {processedData.notificationStatus.message}
                                            </p>
                                            
                                            {processedData.notificationStatus.details?.guardianName && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Guardian: {processedData.notificationStatus.details.guardianName}
                                                </p>
                                            )}
                                            
                                            {processedData.notificationStatus.details?.isProduction === false && (
                                                <p className="text-xs text-orange-600 mt-1">
                                                    ⚠️ Configure Twilio credentials in server/.env to send real SMS
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Debug Section for Processed Data (can be shown in development) */}
                {import.meta.env.DEV && <ProcessedDataDisplay processedData={processedData} />}
                
                {/* Evaluation Mode Selection */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Evaluation Method</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <label className={`flex items-center space-x-3 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-white ${
                            evaluationMode === 'standard' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-300 bg-white'
                        }`}>
                            <input
                                type="radio"
                                name="evaluationMode"
                                value="standard"
                                checked={evaluationMode === 'standard'}
                                onChange={(e) => setEvaluationMode(e.target.value)}
                                className="w-4 h-4 text-blue-600"
                            />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">Standard Evaluation</span>
                                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Fast</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">Keyword-based scoring (~100ms) • 60-75% accuracy</p>
                            </div>
                        </label>
                        
                        <label className={`flex items-center space-x-3 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-white ${
                            evaluationMode === 'llm' 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-300 bg-white'
                        }`}>
                            <input
                                type="radio"
                                name="evaluationMode"
                                value="llm"
                                checked={evaluationMode === 'llm'}
                                onChange={(e) => setEvaluationMode(e.target.value)}
                                className="w-4 h-4 text-purple-600"
                            />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">LLM Evaluation</span>
                                    <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">AI-Powered</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">Semantic understanding (2-5s) • 85-95% accuracy</p>
                            </div>
                        </label>
                    </div>
                </div>
                
                {/* MCQ and Short Answer Summaries */}
                <div className="mt-2 sm:mt-3">
                    <McqSummary 
                        mcqs={processedData.answerSheet.mcqs} 
                        title="MCQ Answers Summary" 
                        bgColor="bg-blue-50" 
                    />
                    
                    <ShortAnswerSummary 
                        questions={processedData.studentSubmission.shortQuestions} 
                        title="Student Short Answers Summary" 
                        bgColor="bg-green-50" 
                    />
                    
                    <ShortAnswerSummary 
                        questions={processedData.answerSheet.shortQuestions} 
                        title="Answer Key Short Questions" 
                        bgColor="bg-yellow-50" 
                    />
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 sm:space-x-4">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base order-2 sm:order-1"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                setIsEvaluating(true);
                                setError(null);
                                
                                // Process the documents for evaluation
                                const newProcessedData = await processDocumentsForEvaluation(
                                    studentSubmission, 
                                    answerSheet
                                );
                                
                                // Update the state with processed data
                                setProcessedData(newProcessedData);
                                
                                // Send the processed data to the backend API for evaluation
                                try {
                                    // Use the evaluation service to send data to the API
                                    await sendEvaluationToApi(
                                        newProcessedData,
                                        evaluationMode, // Pass the selected evaluation mode
                                        // Success callback
                                        (evaluationResults) => {
                                            setProcessedData(prevData => ({
                                                ...prevData,
                                                evaluationResults: evaluationResults
                                            }));
                                            
                                            // Store the evaluation results in the state for teacher review
                                            console.log('AI Evaluation completed successfully');
                                            // Close the loading modal immediately when we get results
                                            setIsEvaluating(false);
                                            setCountdown(30);
                                        },
                                        // Error callback
                                        (errorMessage) => {
                                            setError(`AI Evaluation failed: ${errorMessage}`);
                                            setIsEvaluating(false);
                                        }
                                    );
                                } catch (apiError) {
                                    console.error('API error:', apiError);
                                    setError(`Failed to submit to backend API: ${apiError.message}`);
                                    setIsEvaluating(false);
                                }
                            } catch (err) {
                                console.error('Error processing documents:', err);
                                setError('Failed to process documents for AI evaluation');
                                setIsEvaluating(false);
                            }
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2"
                        disabled={isEvaluating}
                    >
                        {isEvaluating ? (
                            <span className="flex items-center justify-center">
                                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            <>
                                <span className="hidden sm:inline">Run AI Evaluation</span>
                                <span className="sm:hidden">Run Evaluation</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* AI Evaluation Loading Modal */}
            <EvaluationLoadingModal isOpen={isEvaluating} />
        </div>
    );
};

export default EvaluationModal;
