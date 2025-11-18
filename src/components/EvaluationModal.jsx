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

const EvaluationModal = ({ isOpen, onClose, studentSubmission, examId }) => {
    const [answerSheet, setAnswerSheet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [countdown, setCountdown] = useState(30); // Increased time for LLM processing
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
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
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
            <div className="relative top-5 mx-auto p-5 border w-4/5 max-w-5xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Evaluate Submission</h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Student Submission */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-4">Student's Submission</h4>
                        <div className="h-[600px] overflow-y-auto">
                            <DocumentViewer document={studentSubmission} title="Student Submission" />
                        </div>
                    </div>

                    {/* Answer Sheet */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-4">Official Answer Sheet</h4>
                        {loading ? (
                            <LoadingIndicator />
                        ) : error ? (
                            <ErrorDisplay message={error} retry={fetchAnswerSheet} />
                        ) : (
                            <div className="h-[600px] overflow-y-auto">
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
                            <div className="mt-4 flex justify-center">
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
                                            setSaveSuccess(true);
                                            
                                            // Log notification status if available
                                            if (saveResponse.notificationSent) {
                                                console.log('✓ Guardian notified successfully');
                                            }
                                            
                                            // Show success message for 2 seconds before closing
                                            setTimeout(() => {
                                                onClose();
                                            }, 2000);
                                        } catch (error) {
                                            setError(`Failed to save results: ${error.message}`);
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving || saveSuccess}
                                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 shadow-md"
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
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded">
                                <div className="text-center p-6 bg-green-50 rounded-lg shadow-lg border border-green-200">
                                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-green-700 mb-2">Evaluation Saved!</h3>
                                    <p className="text-green-600">Results are now available to the student.</p>
                                    <p className="text-sm text-green-500 mt-2">Guardian has been notified via SMS.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Debug Section for Processed Data (can be shown in development) */}
                {import.meta.env.DEV && <ProcessedDataDisplay processedData={processedData} />}
                
                {/* MCQ and Short Answer Summaries */}
                <div className="mt-2">
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

                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={isEvaluating}
                    >
                        {isEvaluating ? (
                            <span className="flex items-center">
                                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            'Run AI Evaluation'
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
