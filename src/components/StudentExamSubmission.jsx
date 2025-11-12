import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DocumentArrowUpIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import mammoth from 'mammoth';

const StudentExamSubmission = ({ onSubmitSuccess }) => {
    const [examPapers, setExamPapers] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [completedExam, setCompletedExam] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showPreview, setShowPreview] = useState(false);
    const [previousSubmissions, setPreviousSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchAvailableExams();
        fetchPreviousSubmissions();
    }, []);

    const fetchAvailableExams = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/exam-papers', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch exam papers');
            }

            let data = await response.json();
            
            // Filter by student's semester and section
            if (user && user.role === 'student') {
                data = data.filter(paper =>
                    paper.semester === user.semester &&
                    paper.section === user.section
                );
            }
            
            setExamPapers(data);
        } catch (error) {
            setMessage({ 
                text: 'Error fetching exams: ' + error.message, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPreviousSubmissions = async () => {
        try {
            setLoadingSubmissions(true);
            const response = await fetch('http://localhost:5000/api/student-submissions/submissions', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch previous submissions');
            }

            const data = await response.json();
            console.log('Previous submissions:', data);
            setPreviousSubmissions(data);
        } catch (error) {
            console.error('Error fetching previous submissions:', error);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleFileChange = (e) => {
        setCompletedExam(e.target.files[0]);
        setMessage({ text: '', type: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedExam) {
            setMessage({ text: 'Please select an exam', type: 'error' });
            return;
        }
        
        if (!completedExam) {
            setMessage({ text: 'Please upload your completed exam', type: 'error' });
            return;
        }
        
        // Check if student already submitted this exam
        const alreadySubmitted = previousSubmissions.find(
            submission => submission.examPaper === selectedExam || 
                         (submission.examPaper && submission.examPaper._id === selectedExam)
        );
        
        if (alreadySubmitted) {
            const submissionDate = new Date(alreadySubmitted.submissionDate).toLocaleString();
            setMessage({
                text: `You have already submitted this exam on ${submissionDate}. You cannot submit again.`,
                type: 'warning'
            });
            return;
        }

        setSubmitting(true);
        setMessage({ text: '', type: '' });

        try {
            const formData = new FormData();
            formData.append('completedExam', completedExam);
            formData.append('examId', selectedExam);  // Changed parameter name to match controller expectation
            
            console.log('Submitting exam:', selectedExam);
            
            const response = await fetch('http://localhost:5000/api/student-submissions/submit-exam', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ 
                    text: 'Exam submitted successfully!', 
                    type: 'success' 
                });
                setCompletedExam(null);
                setSelectedExam('');
                
                // Call the success callback
                if (typeof onSubmitSuccess === 'function') {
                    onSubmitSuccess();
                }
            } else {
                console.error('Submission error:', data);
                
                // Handle the case where student has already submitted
                if (data.message && data.message.includes('already submitted')) {
                    const submissionDate = data.submissionDate ? new Date(data.submissionDate).toLocaleString() : 'previously';
                    setMessage({ 
                        text: `You have already submitted this exam on ${submissionDate}.`, 
                        type: 'warning' 
                    });
                } else {
                    setMessage({ 
                        text: data.message || 'Submission failed. Please try again.', 
                        type: 'error' 
                    });
                }
            }
        } catch (error) {
            setMessage({ 
                text: 'Error submitting exam: ' + error.message, 
                type: 'error' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    // File preview component
    const PreviewModal = () => {
        const [url, setUrl] = useState(null);
        const [docxHtml, setDocxHtml] = useState(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);
        const docxContentRef = useRef(null);
        
        useEffect(() => {
            if (completedExam) {
                const objectUrl = URL.createObjectURL(completedExam);
                setUrl(objectUrl);
                
                const ext = completedExam.name.split('.').pop().toLowerCase();
                
                // If it's a DOCX file, convert it to HTML using mammoth
                if (ext === 'docx' || ext === 'doc') {
                    setLoading(true);
                    setError(null);
                    
                    // Read the file as ArrayBuffer
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const arrayBuffer = event.target.result;
                            
                            // Convert the DOCX to HTML
                            const result = await mammoth.convertToHtml({ arrayBuffer });
                            setDocxHtml(result.value);
                        } catch (err) {
                            console.error('Error converting DOCX:', err);
                            setError('Failed to preview DOCX file: ' + err.message);
                        } finally {
                            setLoading(false);
                        }
                    };
                    
                    reader.onerror = (err) => {
                        console.error('Error reading file:', err);
                        setError('Failed to read file: ' + err.message);
                        setLoading(false);
                    };
                    
                    reader.readAsArrayBuffer(completedExam);
                }
                
                return () => URL.revokeObjectURL(objectUrl);
            }
        }, [completedExam]);
        
        // Apply styles to DOCX content when it's rendered
        useEffect(() => {
            if (docxContentRef.current && docxHtml) {
                // Apply document styling
                const style = document.createElement('style');
                style.textContent = `
                    .docx-content {
                        font-family: Arial, sans-serif;
                        line-height: 1.5;
                        color: #333;
                    }
                    .docx-content p {
                        margin-bottom: 1rem;
                    }
                    .docx-content h1 {
                        font-size: 2rem;
                        margin-bottom: 1rem;
                    }
                    .docx-content h2 {
                        font-size: 1.5rem;
                        margin-bottom: 0.75rem;
                    }
                    .docx-content table {
                        border-collapse: collapse;
                        width: 100%;
                        margin-bottom: 1rem;
                    }
                    .docx-content th,
                    .docx-content td {
                        border: 1px solid #ddd;
                        padding: 8px;
                    }
                    .docx-content th {
                        background-color: #f2f2f2;
                    }
                    .docx-content img {
                        max-width: 100%;
                        height: auto;
                    }
                `;
                docxContentRef.current.appendChild(style);
            }
        }, [docxHtml]);

        const ext = completedExam?.name?.split('.').pop().toLowerCase();
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="text-lg font-medium">Preview: {completedExam.name}</h3>
                        <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700">
                            <span className="text-2xl">&times;</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4 min-h-[50vh]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                                <p className="text-gray-600">Loading preview...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <ExclamationCircleIcon className="h-12 w-12 text-red-500 mb-4" />
                                <p className="mb-2 text-red-600">{error}</p>
                                <a 
                                    href={url} 
                                    download={completedExam.name}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
                                >
                                    Download Instead
                                </a>
                            </div>
                        ) : ext === 'pdf' ? (
                            <iframe 
                                src={url} 
                                title="PDF Preview" 
                                className="w-full h-full min-h-[500px] border"
                            />
                        ) : ext === 'png' || ext === 'jpg' || ext === 'jpeg' ? (
                            <img 
                                src={url} 
                                alt="Document Preview" 
                                className="max-w-full max-h-[70vh] mx-auto"
                            />
                        ) : ext === 'docx' || ext === 'doc' ? (
                            <div 
                                ref={docxContentRef}
                                className="docx-content p-6 bg-white"
                            >
                                {docxHtml ? (
                                    <div dangerouslySetInnerHTML={{ __html: docxHtml }}></div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center">
                                        <DocumentArrowUpIcon className="h-16 w-16 text-gray-400 mb-4" />
                                        <p className="mb-2">No content to display</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <DocumentArrowUpIcon className="h-16 w-16 text-gray-400 mb-4" />
                                <p className="mb-2">Preview not available for this file type.</p>
                                <a 
                                    href={url} 
                                    download={completedExam.name}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2"
                                >
                                    Download Instead
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Submit Completed Exam</h2>
            
            {loading ? (
                <div className="flex justify-center p-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Exam
                        </label>
                        <select 
                            value={selectedExam} 
                            onChange={(e) => {
                                const examId = e.target.value;
                                setSelectedExam(examId);
                                
                                // Check if student already submitted this exam
                                const alreadySubmitted = previousSubmissions.find(
                                    submission => submission.examPaper === examId || 
                                                 (submission.examPaper && submission.examPaper._id === examId)
                                );
                                
                                if (alreadySubmitted) {
                                    const submissionDate = new Date(alreadySubmitted.submissionDate).toLocaleString();
                                    setMessage({
                                        text: `You have already submitted this exam on ${submissionDate}.`,
                                        type: 'warning'
                                    });
                                } else {
                                    setMessage({ text: '', type: '' });
                                }
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">-- Select an exam --</option>
                            {examPapers.map((paper) => (
                                <option key={paper._id} value={paper._id}>
                                    {paper.title} - {paper.semester} {paper.section}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload Completed Exam (PDF/DOC/DOCX)
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <DocumentArrowUpIcon className="w-10 h-10 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">PDF, DOC, or DOCX (MAX. 10MB)</p>
                                </div>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept=".pdf,.doc,.docx" 
                                    onChange={handleFileChange}
                                    required
                                />
                            </label>
                        </div>
                        
                        {completedExam && (
                            <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm truncate">{completedExam.name}</span>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPreview(true)}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Preview
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCompletedExam(null)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded ${
                            message.type === 'error' 
                                ? 'bg-red-100 text-red-800' 
                                : message.type === 'warning'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                        }`}>
                            {message.type === 'error' || message.type === 'warning' ? (
                                <div className="flex items-center">
                                    <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                                    {message.text}
                                </div>
                            ) : (
                                message.text
                            )}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Completed Exam'}
                        </button>
                    </div>
                </form>
            )}

            {showPreview && completedExam && <PreviewModal />}
        </div>
    );
};

export default StudentExamSubmission;
