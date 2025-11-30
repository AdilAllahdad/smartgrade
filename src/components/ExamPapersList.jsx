import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DocumentArrowDownIcon, EyeIcon, DocumentIcon, DocumentCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import mammoth from 'mammoth';

const ExamPapersList = forwardRef(({ onExamSelect, showResults, onViewResult }, ref) => {
    const [examPapers, setExamPapers] = useState([]);
    const [answerSheets, setAnswerSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewFile, setPreviewFile] = useState(null);
    const [docxHtmlContent, setDocxHtmlContent] = useState(null);
    const [convertingDocx, setConvertingDocx] = useState(false);
    const [docxError, setDocxError] = useState(null);
    const docxContentRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Expose the fetchExamPapers function to parent components
    useImperativeHandle(ref, () => ({
        fetchExamPapers
    }));

    useEffect(() => {
        fetchExamPapers();
    }, []);
    
                        // Debug function to inspect data
    useEffect(() => {
        if (examPapers.length > 0) {
            console.log('Exam Papers with Answer Sheets:', examPapers);
            
            // If user is a student, check which papers have a submission status
            if (user && user.role === 'student') {
                const submittedPapers = examPapers.filter(paper => paper.submitted);
                const evaluatedPapers = examPapers.filter(paper => 
                    paper.status === 'evaluated' || paper.status === 'graded'
                );
                console.log('Submitted papers:', submittedPapers.length, 'Evaluated/Graded papers:', evaluatedPapers.length);
                
                // Log details of each evaluated paper
                if (evaluatedPapers.length > 0) {
                    evaluatedPapers.forEach(paper => {
                        console.log('Evaluated paper:', {
                            title: paper.title,
                            status: paper.status,
                            submissionId: paper.submissionId,
                            resultId: paper.resultId
                        });
                    });
                }
            }
        }
    }, [examPapers, user]);    // State for handling student submissions
    const [selectedExamId, setSelectedExamId] = useState(null);
    const [studentSubmissions, setStudentSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // Fetch student submissions for a selected exam
    const fetchStudentSubmissions = async (examId) => {
        if (!examId) return;
        
        try {
            setLoadingSubmissions(true);
            console.log('Fetching student submissions for exam:', examId);
            
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student-submissions/exam/${examId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch student submissions');
            }
            
            const data = await response.json();
            console.log('Student submissions received:', data);
            setStudentSubmissions(data);
        } catch (error) {
            console.error('Error fetching student submissions:', error);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    // Handle exam selection to show student submissions
    const handleExamSelect = (examId) => {
        setSelectedExamId(examId === selectedExamId ? null : examId);
        if (examId !== selectedExamId) {
            fetchStudentSubmissions(examId);
        }
    };
    
    // Handle student selection to open comparison view
    const handleStudentSelect = (studentId) => {
        if (selectedExamId && onExamSelect) {
            onExamSelect(selectedExamId, studentId);
        }
    };
    
    // Apply styles to the DOCX content when it's rendered
    useEffect(() => {
        if (docxContentRef.current && docxHtmlContent) {
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
                    margin-top: 1.5rem;
                }
                .docx-content h2 {
                    font-size: 1.5rem;
                    margin-bottom: 0.75rem;
                    margin-top: 1.25rem;
                }
                .docx-content h3 {
                    font-size: 1.25rem;
                    margin-bottom: 0.75rem;
                    margin-top: 1rem;
                }
                .docx-content table {
                    border-collapse: collapse;
                    width: 100%;
                    margin-bottom: 1rem;
                }
                .docx-content th, .docx-content td {
                    border: 1px solid #ddd;
                    padding: 8px;
                }
                .docx-content ul, .docx-content ol {
                    margin-bottom: 1rem;
                    margin-left: 2rem;
                }
            `;
            docxContentRef.current.appendChild(style);
        }
    }, [docxHtmlContent]);

    const fetchExamPapers = async () => {
        try {
            // Fetch exam papers
            const papersResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exam-papers`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!papersResponse.ok) {
                throw new Error('Failed to fetch exam papers');
            }

            let papersData = await papersResponse.json();
            let answersData = [];
            
            // Only fetch answer sheets for teachers
            if (user && user.role === 'teacher') {
                const answersResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/answer-sheets`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!answersResponse.ok) {
                    throw new Error('Failed to fetch answer sheets');
                }

                answersData = await answersResponse.json();
                
                // Associate answer sheets with their corresponding exam papers
                papersData = papersData.map(paper => {
                    const relevantAnswerSheets = answersData.filter(sheet => {
                        // Check both examPaper and examPaperId fields, handle string vs ObjectId
                        return (sheet.examPaper && sheet.examPaper.toString() === paper._id.toString()) ||
                               (sheet.examPaperId && sheet.examPaperId.toString() === paper._id.toString());
                    });
                    return {
                        ...paper,
                        answerSheets: relevantAnswerSheets
                    };
                });
                
                setAnswerSheets(answersData);
            }

            // If user is a student, filter by semester and section
            if (user && user.role === 'student') {
                // First filter by semester and section
                papersData = papersData.filter(paper =>
                    paper.semester === user.semester &&
                    paper.section === user.section
                );
                
                // Then fetch submission status for each paper
                try {
                    const submissionsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student-submissions/submissions`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    
                    if (submissionsResponse.ok) {
                        const submissionsData = await submissionsResponse.json();
                        console.log("Student submissions data:", submissionsData);
                        
                        // Add submission status to papers
                        papersData = papersData.map(paper => {
                            // Find the submission for this exam paper, handling different ways the ID might be stored
                            const submission = submissionsData.find(sub => {
                                if (!sub.examPaper) return false;
                                
                                // Get the exam paper ID as string for comparison
                                const examPaperId = typeof sub.examPaper === 'object' && sub.examPaper._id 
                                    ? sub.examPaper._id.toString() 
                                    : sub.examPaper.toString();
                                
                                // Get the paper ID as string
                                const currentPaperId = paper._id.toString();
                                
                                return examPaperId === currentPaperId;
                            });
                            
                            console.log(`Paper ${paper.title} - Has submission:`, !!submission, 
                                submission ? `Status: ${submission.status}` : '');
                            
                            return {
                                ...paper,
                                status: submission ? submission.status : 'pending',
                                submissionId: submission ? submission._id : null,
                                submitted: !!submission,
                                resultId: submission ? submission.resultId : null,
                                submissionData: submission // Include full submission data for debugging
                            };
                        });
                        
                        console.log('Papers with submission status:', papersData);
                    }
                } catch (submissionError) {
                    console.error('Error fetching student submissions:', submissionError);
                }
            }
            
            setExamPapers(papersData);
        } catch (error) {
            setError('Error fetching data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (downloadUrl, fileName = 'document') => {
        try {
            console.log('Downloading from URL:', downloadUrl);
            
            if (!downloadUrl) {
                console.error('Download URL is missing');
                alert('Error: Download URL is missing.');
                return;
            }
            
            // Make sure downloadUrl starts with a slash
            if (!downloadUrl.startsWith('/')) {
                downloadUrl = '/' + downloadUrl;
            }
            
            console.log('Full download URL:', `${import.meta.env.VITE_API_BASE_URL}${downloadUrl}`);
            
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Authentication token is missing');
                alert('Error: You need to be logged in to download files.');
                return;
            }
            
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${downloadUrl}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                // Add timeout to prevent hanging requests
                signal: AbortSignal.timeout(30000) // 30 seconds timeout
            });

            if (!response.ok) {
                console.error('Download response not OK:', response.status, response.statusText);
                
                // Try to get error message from response
                try {
                    const errorData = await response.json();
                    console.error('Error details:', errorData);
                    throw new Error(`Failed to download file: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
                } catch (jsonError) {
                    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
                }
            }

            const blob = await response.blob();
            console.log('File downloaded as blob:', blob.size, 'bytes, type:', blob.type);
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'exam-document';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log('Download complete and file save triggered');
        } catch (error) {
            console.error('Download error:', error);
            alert('Error downloading file: ' + error.message);
        }
    };

    const handlePreview = async (downloadUrl, fileName) => {
        try {
            console.log('Previewing from URL:', downloadUrl);
            
            if (!downloadUrl) {
                console.error('Preview URL is missing');
                alert('Error: Preview URL is missing.');
                return;
            }
            
            // Make sure downloadUrl starts with a slash
            if (!downloadUrl.startsWith('/')) {
                downloadUrl = '/' + downloadUrl;
            }
            
            console.log('Full preview URL:', `${import.meta.env.VITE_API_BASE_URL}${downloadUrl}`);
            
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Authentication token is missing');
                alert('Error: You need to be logged in to preview files.');
                return;
            }
            
            // Reset DOCX states before fetching a new file
            setDocxHtmlContent(null);
            setConvertingDocx(false);
            setDocxError(null);
            
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${downloadUrl}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                // Add timeout to prevent hanging requests
                signal: AbortSignal.timeout(30000) // 30 seconds timeout
            });

            if (!response.ok) {
                console.error('Preview response not OK:', response.status, response.statusText);
                
                // Try to get error message from response
                try {
                    const errorData = await response.json();
                    console.error('Error details:', errorData);
                    throw new Error(`Failed to preview file: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
                } catch (jsonError) {
                    throw new Error(`Failed to preview file: ${response.status} ${response.statusText}`);
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const fileExt = fileName.split('.').pop().toLowerCase();
            
            console.log('File details for preview:', {
                name: fileName,
                type: blob.type,
                extension: fileExt,
                size: blob.size
            });
            
            // Enhanced file type detection - check both extension and mime type
            const isDocxFile = fileExt === 'docx' || 
                               blob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                               fileName.toLowerCase().endsWith('.docx');
            
            // Handle different file types
            if (isDocxFile) {
                console.log('DOCX file detected, using mammoth for preview');
                
                // Set preview file info first to show the modal
                setPreviewFile({
                    url,
                    name: fileName || 'document',
                    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    isDocx: true
                });
                
                // Start the conversion process
                setConvertingDocx(true);
                
                try {
                    // Use mammoth.js to convert DOCX to HTML
                    const arrayBuffer = await blob.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setDocxHtmlContent(result.value);
                    setConvertingDocx(false);
                } catch (conversionError) {
                    console.error('DOCX conversion error:', conversionError);
                    setDocxError(`Failed to convert DOCX file: ${conversionError.message}`);
                    setConvertingDocx(false);
                }
            } 
            // For PDF files
            else if (blob.type === 'application/pdf') {
                console.log('PDF file detected, using native preview');
                setPreviewFile({
                    url,
                    name: fileName || 'document',
                    type: blob.type,
                    isDocx: false
                });
            }
            // For image files 
            else if (blob.type.startsWith('image/')) {
                console.log('Image file detected, using native preview');
                setPreviewFile({
                    url,
                    name: fileName || 'document',
                    type: blob.type,
                    isDocx: false
                });
            }
            // For other file types
            else {
                console.warn('Unknown file type, showing download option:', blob.type);
                setPreviewFile({
                    url,
                    name: fileName || 'document',
                    type: blob.type,
                    isDocx: false
                });
            }
        } catch (error) {
            console.error('Preview error:', error);
            alert('Error previewing file: ' + error.message);
            setConvertingDocx(false);
        }
    };

    const closePreview = () => {
        if (previewFile) {
            URL.revokeObjectURL(previewFile.url);
            setPreviewFile(null);
            setDocxHtmlContent(null);
            setConvertingDocx(false);
            setDocxError(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>;
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-50 rounded">{error}</div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Combined Exam Papers and Answer Sheets Section */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
                    {user && user.role === 'student' ? 'Exam Papers & Results' : 'Exam Papers & Answer Sheets'}
                </h2>
                {examPapers.length === 0 ? (
                    <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-lg">
                        <p className="text-sm sm:text-base text-gray-500 mb-2">
                            {user && user.role === 'teacher' 
                                ? "You haven't uploaded any exam papers yet."
                                : "No exam papers are available for you at this time."}
                        </p>
                        {user && user.role === 'teacher' && (
                            <p className="text-sm sm:text-base text-blue-600">
                                Use the "Upload Exam Papers" section above to add your first exam paper.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-6 md:space-y-8">
                        {examPapers.map((paper) => (
                            <div key={paper._id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl shadow-md overflow-hidden border border-blue-100">
                                {/* Exam Paper Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-2 sm:gap-0">
                                    <div className="flex items-center min-w-0">
                                        <DocumentIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold truncate">{paper.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                        {user && user.role === 'student' && paper.status && (
                                            (paper.status === 'evaluated' || paper.status === 'graded') ? (
                                                <div className="text-xs font-medium bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full">
                                                    {paper.status === 'graded' ? 'Graded' : 'Evaluated'}
                                                </div>
                                            ) : paper.submitted ? (
                                                <div className="text-xs font-medium bg-yellow-500 text-white px-2 sm:px-3 py-1 rounded-full">
                                                    Submitted
                                                </div>
                                            ) : null
                                        )}
                                        <div className="text-xs sm:text-sm font-medium bg-white text-indigo-700 px-2 sm:px-3 py-1 rounded-full">
                                            {paper.semester} / {paper.section}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-3 sm:p-4 md:p-5">
                                    {/* Paper Details */}
                                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm mb-3 sm:mb-4 md:mb-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                                            <h4 className="font-semibold text-sm sm:text-base md:text-lg flex items-center">
                                                <DocumentIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
                                                Question Paper
                                            </h4>
                                            <span className="text-xs sm:text-sm text-gray-600">
                                                Uploaded: {new Date(paper.uploadDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between mt-2">
                                            <button
                                                onClick={() => {
                                                    console.log('Preview paper:', paper);
                                                    // Check if downloadUrl exists, or construct it from the ID
                                                    const url = paper.downloadUrl || `/api/exam-papers/download/${paper._id}`;
                                                    handlePreview(url, paper.filename || 'question-paper.pdf');
                                                }}
                                                className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 text-sm sm:text-base rounded hover:bg-gray-200 w-full sm:w-auto"
                                            >
                                                <EyeIcon className="h-4 w-4 mr-1" />
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => {
                                                    console.log('Download paper:', paper);
                                                    // Check if downloadUrl exists, or construct it from the ID
                                                    const url = paper.downloadUrl || `/api/exam-papers/download/${paper._id}`;
                                                    handleDownload(url, paper.filename || 'question-paper.pdf');
                                                }}
                                                className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded hover:bg-blue-700 w-full sm:w-auto"
                                            >
                                                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                                                Download
                                            </button>
                                        </div>
                                    </div>

                                    {/* Answer Sheets - Only visible for teachers */}
                                    {user && user.role === 'teacher' && (
                                        <div className="mt-3 sm:mt-4 md:mt-5 bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-lg border border-green-100">
                                            <h4 className="font-semibold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 flex items-center">
                                                <DocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2" />
                                                Associated Answer Sheets
                                            </h4>
                                            
                                            {(!paper.answerSheets || paper.answerSheets.length === 0) ? (
                                                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm text-center">
                                                    <p className="text-sm sm:text-base text-gray-500 italic">No answer sheets available for this exam.</p>
                                                    <p className="text-xs sm:text-sm text-blue-500 mt-2">
                                                        You can upload an answer sheet for this exam from the "Upload Exam Materials" section.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 sm:space-y-4">
                                                    {paper.answerSheets.map((sheet) => (
                                                        <div key={sheet._id} className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-green-100">
                                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-2 sm:mb-3">
                                                                <h5 className="font-medium text-sm sm:text-base text-green-800 break-words">{sheet.filename}</h5>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(sheet.uploadDate).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between mt-2">
                                                                <button
                                                                    onClick={() => {
                                                                        console.log('Preview sheet:', sheet);
                                                                        // Check if downloadUrl exists, or construct it from the ID
                                                                        const url = sheet.downloadUrl || `/api/answer-sheets/download/${sheet._id}`;
                                                                        handlePreview(url, sheet.filename || 'answer-sheet.pdf');
                                                                    }}
                                                                    className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 w-full sm:w-auto"
                                                                >
                                                                    <EyeIcon className="h-4 w-4 mr-1" />
                                                                    Preview
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        console.log('Download sheet:', sheet);
                                                                        // Check if downloadUrl exists, or construct it from the ID
                                                                        const url = sheet.downloadUrl || `/api/answer-sheets/download/${sheet._id}`;
                                                                        handleDownload(url, sheet.filename || 'answer-sheet.pdf');
                                                                    }}
                                                                    className="flex items-center justify-center px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 w-full sm:w-auto"
                                                                >
                                                                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                                                                    Download
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Student Submissions Section - Only visible for teachers */}
                                    {user && user.role === 'teacher' && (
                                        <div className="mt-3 sm:mt-4 md:mt-5">
                                            <button
                                                onClick={() => navigate(`/exam/${paper._id}/submissions`)}
                                                className="flex items-center justify-between w-full p-3 sm:p-4 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200"
                                            >
                                                <span className="text-sm sm:text-base font-semibold flex items-center">
                                                    <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                                    Student Submissions
                                                </span>
                                                <span className="text-xs sm:text-sm bg-purple-600 text-white px-2 py-1 rounded-full">
                                                    {paper.submissionCount || 0} submissions
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    {/* See Result Button - Only visible for students when exam has been graded or evaluated */}
                                    {user && user.role === 'student' && showResults && (paper.status === 'graded' || paper.status === 'evaluated') && (
                                        <div className="mt-3 sm:mt-4 md:mt-5">
                                            <button
                                                onClick={() => onViewResult && onViewResult(paper._id)}
                                                className="flex items-center justify-between w-full p-3 sm:p-4 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 border border-green-200"
                                            >
                                                <span className="text-sm sm:text-base font-semibold flex items-center">
                                                    <DocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                                    See Result
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
                    <div className="bg-white rounded-lg sm:rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="p-3 sm:p-4 border-b flex justify-between items-center">
                            <h3 className="text-sm sm:text-base md:text-lg font-medium truncate pr-2">Preview: {previewFile.name}</h3>
                            <button onClick={closePreview} className="text-gray-500 hover:text-gray-700">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-2 sm:p-4 min-h-[50vh]">
                            {/* Debug info - remove in production */}
                            {process.env.NODE_ENV !== 'production' && (
                                <div className="text-xs text-gray-500 mb-2 p-1 bg-gray-100 rounded">
                                    Debug: Type={previewFile.type}, isDocx={previewFile.isDocx ? 'true' : 'false'}, Name={previewFile.name}
                                </div>
                            )}
                            
                            {previewFile.type === 'application/pdf' ? (
                                <iframe 
                                    src={previewFile.url} 
                                    title="PDF Preview" 
                                    className="w-full h-full min-h-[400px] sm:min-h-[500px] border"
                                />
                            ) : previewFile.type.startsWith('image/') ? (
                                <img 
                                    src={previewFile.url} 
                                    alt="Document Preview" 
                                    className="max-w-full max-h-[60vh] sm:max-h-[70vh] mx-auto"
                                />
                            ) : previewFile.isDocx ? (
                                <div className="border rounded p-2 sm:p-4 bg-white h-full min-h-[400px] sm:min-h-[500px] overflow-auto">
                                    {convertingDocx ? (
                                        <div className="flex flex-col justify-center items-center h-full">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
                                            <span className="text-gray-700">Converting document...</span>
                                            <span className="text-gray-500 text-sm mt-2">This may take a moment for large files</span>
                                        </div>
                                    ) : docxError ? (
                                        <div className="text-red-500 text-center p-4">
                                            <p className="mb-4">{docxError}</p>
                                            <div className="mt-2">
                                                <a 
                                                    href={previewFile.url} 
                                                    download={previewFile.name}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
                                                >
                                                    Download File Instead
                                                </a>
                                            </div>
                                        </div>
                                    ) : docxHtmlContent ? (
                                        <div 
                                            ref={docxContentRef} 
                                            className="docx-content" 
                                            dangerouslySetInnerHTML={{ __html: docxHtmlContent }}
                                        />
                                    ) : (
                                        <div className="text-center text-gray-600 h-full flex items-center justify-center">
                                            <p>Preparing document preview...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <DocumentIcon className="h-16 w-16 text-gray-400 mb-4" />
                                    <p className="mb-2">Preview not available for this file type.</p>
                                    <a 
                                        href={previewFile.url} 
                                        download={previewFile.name}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2"
                                    >
                                        Download Instead
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ExamPapersList;
