import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';

export default function ExamAndAnswerUpload({ onUploadSuccess }) {
    const [examPaper, setExamPaper] = useState(null);
    const [answerSheet, setAnswerSheet] = useState(null);
    const [title, setTitle] = useState('');
    const [semester, setSemester] = useState('');
    const [section, setSection] = useState('');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [showExamPreview, setShowExamPreview] = useState(false);
    const [showAnswerPreview, setShowAnswerPreview] = useState(false);
    const [fileError, setFileError] = useState('');
    // Eye icon SVG
    const EyeIcon = ({ onClick }) => (
        <button type="button" onClick={onClick} className="ml-2 p-1 hover:bg-gray-200 rounded" title="Preview Document">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
        </button>
    );

    const validateFile = (file) => {
        if (!file) return { valid: false, error: "No file selected" };
        
        const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
        const allowedTypes = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (file.size > MAX_FILE_SIZE) {
            return { valid: false, error: `File size exceeds 15MB limit` };
        }
        
        if (!(['pdf', 'doc', 'docx'].includes(fileExt))) {
            return { valid: false, error: "Only PDF, DOC, and DOCX files are allowed" };
        }
        
        return { valid: true, error: "" };
    };

    const handleExamPaperChange = (e) => {
        setFileError('');
        setMessage('');
        const file = e.target.files[0];
        if (!file) return;
        
        const validation = validateFile(file);
        if (validation.valid) {
            setExamPaper(file);
        } else {
            setFileError(validation.error);
            e.target.value = null; // Reset file input
        }
    };
    
    const handleAnswerSheetChange = (e) => {
        setFileError('');
        setMessage('');
        const file = e.target.files[0];
        if (!file) return;
        
        const validation = validateFile(file);
        if (validation.valid) {
            setAnswerSheet(file);
        } else {
            setFileError(validation.error);
            e.target.value = null; // Reset file input
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!examPaper || !answerSheet || !title || !semester || !section) {
            setMessage('All fields and both files are required.');
            return;
        }
        setUploading(true);
        setMessage('');
        try {
            const formData = new FormData();
            formData.append('examPaper', examPaper);
            formData.append('answerSheet', answerSheet);
            formData.append('title', title);
            formData.append('semester', semester);
            formData.append('section', section);
            const response = await fetch('http://localhost:5000/api/exam-papers/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Upload successful!');
                setExamPaper(null);
                setAnswerSheet(null);
                setTitle('');
                setSemester('');
                setSection('');
                // Call the success callback to refresh the list
                if (typeof onUploadSuccess === 'function') {
                    onUploadSuccess();
                }
            } else {
                setMessage(data.message || 'Upload failed.');
            }
        } catch (err) {
            setMessage('Upload failed.');
        }
        setUploading(false);
    };

    return (
        <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Upload Exam Paper & Answer Sheet</h2>
                <p className="text-gray-600 mt-1">Complete the form below to upload your documents</p>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-5">
                {/* Form details section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                    <h3 className="text-md font-semibold text-blue-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exam Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-3 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input 
                                type="text" 
                                placeholder="e.g., Mid-Term Exam" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                                required 
                            />
                        </div>
                        <div className="col-span-3 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                            <input 
                                type="text" 
                                placeholder="e.g., Fall 2025" 
                                value={semester} 
                                onChange={e => setSemester(e.target.value)} 
                                className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                                required 
                            />
                        </div>
                        <div className="col-span-3 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <input 
                                type="text" 
                                placeholder="e.g., A or 1" 
                                value={section} 
                                onChange={e => setSection(e.target.value)} 
                                className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                                required 
                            />
                        </div>
                    </div>
                </div>
                
                {/* File Upload Section */}
                <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <label className="font-medium flex items-center justify-between text-gray-700 mb-2">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Exam Paper (PDF/DOC/DOCX)
                            </div>
                            {examPaper && <EyeIcon onClick={() => setShowExamPreview(true)} />}
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col w-full h-24 border-2 border-blue-200 border-dashed hover:bg-gray-100 hover:border-blue-300 rounded-lg cursor-pointer">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-500 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="pt-1 text-sm tracking-wider text-gray-500 group-hover:text-gray-600">
                                        {examPaper ? examPaper.name : 'Click to upload exam paper'}
                                    </p>
                                </div>
                                <input 
                                    type="file" 
                                    accept=".pdf,.doc,.docx" 
                                    onChange={handleExamPaperChange} 
                                    className="hidden" 
                                    required 
                                />
                            </label>
                        </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <label className="font-medium flex items-center justify-between text-gray-700 mb-2">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Answer Sheet (PDF/DOC/DOCX)
                            </div>
                            {answerSheet && <EyeIcon onClick={() => setShowAnswerPreview(true)} />}
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col w-full h-24 border-2 border-green-200 border-dashed hover:bg-gray-100 hover:border-green-300 rounded-lg cursor-pointer">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-500 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="pt-1 text-sm tracking-wider text-gray-500 group-hover:text-gray-600">
                                        {answerSheet ? answerSheet.name : 'Click to upload answer sheet'}
                                    </p>
                                </div>
                                <input 
                                    type="file" 
                                    accept=".pdf,.doc,.docx" 
                                    onChange={handleAnswerSheetChange} 
                                    className="hidden" 
                                    required 
                                />
                            </label>
                        </div>
                    </div>
                </div>
                
                <div className="pt-4">
                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors duration-300 flex items-center justify-center font-medium" 
                        disabled={uploading}
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                                </svg>
                                Upload Documents
                            </>
                        )}
                    </button>
                </div>
                
                {/* Notifications */}
                {fileError && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-md border border-red-200 flex items-start mt-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{fileError}</span>
                    </div>
                )}
                
                {message && (
                    <div className={`p-3 rounded-md border flex items-start mt-3 ${message.includes('successful') ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            {message.includes('successful') ? (
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            ) : (
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            )}
                        </svg>
                        <span>{message}</span>
                    </div>
                )}
            </form>

            {/* Preview Modals */}
            {showExamPreview && examPaper && (
                <PreviewModal file={examPaper} onClose={() => setShowExamPreview(false)} />
            )}
            {showAnswerPreview && answerSheet && (
                <PreviewModal file={answerSheet} onClose={() => setShowAnswerPreview(false)} />
            )}
        </div>
    );
}

// PreviewModal component for file preview
function PreviewModal({ file, onClose }) {
    const [url, setUrl] = useState(null);
    const [htmlContent, setHtmlContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const contentRef = useRef(null);
    
    React.useEffect(() => {
        if (file) {
            setUrl(URL.createObjectURL(file));
            
            // If it's a DOCX file, convert it to HTML
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext === 'docx') {
                setLoading(true);
                setError(null);
                
                // Use mammoth.js to convert DOCX to HTML
                const reader = new FileReader();
                reader.onload = function(event) {
                    const arrayBuffer = event.target.result;
                    
                    mammoth.convertToHtml({ arrayBuffer })
                        .then(result => {
                            setHtmlContent(result.value);
                            setLoading(false);
                        })
                        .catch(err => {
                            console.error("Error converting DOCX to HTML:", err);
                            setError("Failed to preview DOCX file: " + err.message);
                            setLoading(false);
                        });
                };
                reader.onerror = function() {
                    setError("Failed to read the file");
                    setLoading(false);
                };
                reader.readAsArrayBuffer(file);
            }
            
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);
    
    // Apply styles to the rendered DOCX content
    React.useEffect(() => {
        if (contentRef.current && htmlContent) {
            // Apply some basic styling to the rendered document
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .docx-content {
                    font-family: Arial, sans-serif;
                    line-height: 1.5;
                    color: #333;
                }
                .docx-content p {
                    margin-bottom: 1rem;
                }
                .docx-content h1, .docx-content h2, .docx-content h3 {
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                }
                .docx-content table {
                    border-collapse: collapse;
                    width: 100%;
                    margin-bottom: 1rem;
                }
                .docx-content td, .docx-content th {
                    border: 1px solid #ddd;
                    padding: 8px;
                }
            `;
            contentRef.current.appendChild(styleElement);
        }
    }, [htmlContent, contentRef.current]);

    // Determine file type and how to preview it
    const ext = file?.name?.split('.').pop().toLowerCase();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-4 max-w-4xl w-full relative max-h-[90vh] overflow-hidden flex flex-col">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl z-10">&times;</button>
                <div className="mb-2 font-semibold">Preview: {file.name}</div>
                <div className="flex-grow overflow-auto">
                    {ext === 'pdf' ? (
                        <iframe src={url} title="PDF Preview" className="w-full h-[70vh] border rounded" />
                    ) : ext === 'png' || ext === 'jpg' || ext === 'jpeg' ? (
                        <img src={url} alt="Preview" className="max-h-[70vh] mx-auto" />
                    ) : ext === 'docx' ? (
                        <div className="border rounded p-4 bg-white h-[70vh] overflow-auto">
                            {loading ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                                    <span className="ml-3">Converting document...</span>
                                </div>
                            ) : error ? (
                                <div className="text-red-500 text-center p-4">
                                    {error}
                                    <div className="mt-2">
                                        <button 
                                            onClick={() => window.open(url, '_blank')}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Download File Instead
                                        </button>
                                    </div>
                                </div>
                            ) : htmlContent ? (
                                <div 
                                    ref={contentRef} 
                                    className="docx-content" 
                                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                                ></div>
                            ) : (
                                <div className="text-center text-gray-600">No preview available</div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 text-center border rounded">
                            <div className="text-lg font-bold mb-2">File Details</div>
                            <div className="flex flex-col items-center space-y-2">
                                <div className="p-3 bg-gray-100 rounded-full mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                </div>
                                <div><strong>Name:</strong> {file.name}</div>
                                <div><strong>Type:</strong> {file.type || `${ext.toUpperCase()} file`}</div>
                                <div><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</div>
                                <div className="mt-4 text-gray-600">Browser preview is not available for this file type.</div>
                                <div className="text-gray-600">The file will be uploaded normally.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
