import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import ExamComparisonView from '../components/ExamComparisonView';
import DocxViewer from '../components/DocxViewer';
import EvaluationModal from '../components/EvaluationModal';
import {
    ArrowLeftIcon,
    DocumentTextIcon,
    UserIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentCheckIcon,
    DocumentArrowDownIcon,
    EyeIcon
} from '@heroicons/react/24/outline';


const StudentSubmissionsPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [examDetails, setExamDetails] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedStudentFile, setSelectedStudentFile] = useState(null);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);

    useEffect(() => {
        if (!examId) {
            setError('No exam ID provided');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch exam details
                const examResponse = await fetch(`http://localhost:5000/api/exam-papers/${examId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!examResponse.ok) {
                    throw new Error('Failed to fetch exam details');
                }

                const examData = await examResponse.json();

                // Fetch answer sheets if user is a teacher
                if (user && user.role === 'teacher') {
                    const answersResponse = await fetch('http://localhost:5000/api/answer-sheets', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (answersResponse.ok) {
                        const answersData = await answersResponse.json();
                        // Filter answer sheets for this exam
                        const relevantAnswerSheets = answersData.filter(sheet => 
                            (sheet.examPaper && sheet.examPaper.toString() === examId) ||
                            (sheet.examPaperId && sheet.examPaperId.toString() === examId)
                        );
                        examData.answerSheets = relevantAnswerSheets;
                    }
                }

                setExamDetails(examData);

                // Fetch student submissions for this exam
                const submissionsResponse = await fetch(`http://localhost:5000/api/student-submissions/exam/${examId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!submissionsResponse.ok) {
                    throw new Error('Failed to fetch student submissions');
                }

                const submissionsData = await submissionsResponse.json();
                console.log('Submissions data:', submissionsData);
                setSubmissions(submissionsData);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [examId]);

    const handleStudentSelect = async (studentId) => {
        setSelectedStudent(studentId);
        setSelectedStudentFile(null);
        try {
            // Use the correct API endpoint
            const res = await fetch(`http://localhost:5000/api/student-submissions/exam/${examId}/student/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch student file');
            const data = await res.json();
            
            // Construct the file URL using the new GridFS endpoint
            const fileUrl = `http://localhost:5000/api/student-submissions/file/${data.filename}`;
            setSelectedStudentFile(fileUrl);
        } catch (err) {
            setSelectedStudentFile(null);
            setError('Failed to load student submission. Please try again.');
            console.error('Error fetching student file:', err);
        }
        // Scroll to the comparison view
        setTimeout(() => {
            document.getElementById('comparisonView')?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    if (loading) {
        return (
            <DashboardLayout allowedRoles={['teacher', 'admin']}>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading submissions...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout allowedRoles={['teacher', 'admin']}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={() => navigate('/teacher')}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        Back to Dashboard
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout allowedRoles={['teacher', 'admin']}>
            <div className="space-y-8">
                {/* Back Button and Page Title */}
                <div className="flex justify-between items-center">
                    <button 
                        onClick={() => navigate('/teacher')}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-1" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Student Submissions</h1>
                </div>

                {/* Exam Details Card */}
                {examDetails && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">{examDetails.title}</h2>
                                <div className="flex flex-wrap gap-3 mt-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        {new Date(examDetails.uploadDate).toLocaleDateString()}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                                        {examDetails.semester} Semester
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        <UserIcon className="h-4 w-4 mr-1" />
                                        Section {examDetails.section}
                                    </span>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <a 
                                    href={examDetails.downloadUrl} 
                                    download
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                    Download Exam
                                </a>
                            </div>
                        </div>

                        {/* Associated Answer Sheets Section */}
                        {user && user.role === 'teacher' && (
                            <div className="mt-5 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                                <h4 className="font-semibold text-lg mb-3 flex items-center">
                                    <DocumentCheckIcon className="h-5 w-5 text-green-600 mr-2" />
                                    Associated Answer Sheets
                                </h4>
                                
                                {(!examDetails.answerSheets || examDetails.answerSheets.length === 0) ? (
                                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                                        <p className="text-gray-500 italic">No answer sheets available for this exam.</p>
                                        <p className="text-sm text-blue-500 mt-2">
                                            You can upload an answer sheet for this exam from the "Upload Exam Materials" section.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {examDetails.answerSheets.map((sheet) => (
                                            <div key={sheet._id} className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h5 className="font-medium text-green-800">{sheet.filename}</h5>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(sheet.uploadDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex justify-between mt-2">
                                                    <button
                                                        onClick={() => {
                                                            const url = sheet.downloadUrl || `/api/answer-sheets/download/${sheet._id}`;
                                                            const fileUrl = `http://localhost:5000${url}`;
                                                            
                                                            if (/\.docx$/i.test(sheet.filename)) {
                                                                setPreviewFile({
                                                                    url: fileUrl,
                                                                    name: sheet.filename,
                                                                    isDocx: true
                                                                });
                                                            } else {
                                                                window.open(fileUrl, '_blank');
                                                            }
                                                        }}
                                                        className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                    >
                                                        <EyeIcon className="h-4 w-4 mr-1" />
                                                        Preview
                                                    </button>
                                                    <a
                                                        href={`http://localhost:5000${sheet.downloadUrl || `/api/answer-sheets/download/${sheet._id}`}`}
                                                        download={sheet.filename}
                                                        className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                                                    >
                                                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                                                        Download
                                                    </a>
                                                </div>
                                                {previewFile && previewFile.isDocx && sheet.filename === previewFile.name && (
                                                    <div className="mt-4 border rounded p-4 bg-white">
                                                        <DocxViewer
                                                            fileUrl={previewFile.url}
                                                            filename={previewFile.name}
                                                            onError={() => (
                                                                <div className="text-center py-4">
                                                                    <p className="text-red-500 mb-4">Failed to convert document. Please try downloading instead.</p>
                                                                    <button
                                                                        onClick={() => window.open(previewFile.url, '_blank')}
                                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                                                    >
                                                                        Download Original Document
                                                                    </button>
                                                                </div>
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Submissions List */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        <span className="flex items-center">
                            <DocumentCheckIcon className="h-6 w-6 text-blue-600 mr-2" />
                            Student Submissions ({submissions.length})
                        </span>
                    </h2>

                    {submissions.length === 0 ? (
                        <div className="text-center py-8">
                            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No student submissions yet for this exam.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {submissions.map((submission) => {
                                const student = submission.student;
                                // Defensive: skip if student is null
                                if (!student) return null;
                                return (
                                    <div 
                                        key={submission._id}
                                        className={`p-4 rounded-lg border transition-all ${
                                            selectedStudent === student._id ? 
                                                'border-blue-500 bg-blue-50 shadow-md' : 
                                                'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                        onClick={() => handleStudentSelect(student._id)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-medium">
                                                    {student.name || `Student ID: ${student._id}`}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Registration No: {student.rollNumber || 'N/A'}<br/>
                                                    Uploaded Exam Sheet: {submission.filename || 'N/A'}<br/>
                                                    Submitted: {new Date(submission.submissionDate).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center">
                                                    {submission.score !== undefined ? (
                                                        <div className="flex items-center">
                                                            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-1" />
                                                            <span className="font-medium">{submission.score}/100</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center">
                                                            <ClockIcon className="h-5 w-5 text-yellow-600 mr-1" />
                                                            <span className="text-yellow-600">Not graded</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button 
                                                        className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStudentSelect(student._id);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button 
                                                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Get the first answer sheet if available
                                                            const examAnswerSheet = examDetails.answerSheets && examDetails.answerSheets.length > 0 
                                                                ? examDetails.answerSheets[0] 
                                                                : null;
                                                            
                                                            setSelectedSubmission({
                                                                ...submission,
                                                                fileUrl: `http://localhost:5000/api/student-submissions/file/${submission.filename}`,
                                                                student,
                                                                answerSheet: examAnswerSheet ? {
                                                                    ...examAnswerSheet,
                                                                    fileUrl: `http://localhost:5000${examAnswerSheet.downloadUrl || `/api/answer-sheets/download/${examAnswerSheet._id}`}`
                                                                } : null
                                                            });
                                                            setShowEvaluationModal(true);
                                                        }}
                                                    >
                                                        Evaluate
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Show the fetched file below if this student is selected */}
                                        {selectedStudent === student._id && (
                                            <div className="mt-4 p-4 bg-white border border-blue-200 rounded shadow">
                                                <h4 className="font-semibold mb-2">Submitted Exam Paper:</h4>
                                                {!selectedStudentFile ? (
                                                    <div className="text-center py-4">
                                                        <div className="animate-spin h-8 w-8 mx-auto mb-2 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                                                        <p className="text-gray-600">Loading submission...</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {/\.pdf$/i.test(submission.filename) && (
                                                            <>
                                                                <iframe
                                                                    src={selectedStudentFile}
                                                                    title="Submitted Exam PDF"
                                                                    className="w-full h-[600px] border rounded"
                                                                    onError={(e) => {
                                                                        setError('Failed to load PDF. Please try downloading instead.');
                                                                    }}
                                                                />
                                                                <div className="flex space-x-2">
                                                                    <a
                                                                        href={selectedStudentFile}
                                                                        download={submission.filename}
                                                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                                    >
                                                                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                                                        Download PDF
                                                                    </a>
                                                                </div>
                                                            </>
                                                        )}
                                                        
                                                        {/\.(jpg|jpeg|png|gif)$/i.test(submission.filename) && (
                                                            <>
                                                                <img
                                                                    src={selectedStudentFile}
                                                                    alt="Submitted Exam"
                                                                    className="max-w-full border rounded"
                                                                    onError={(e) => {
                                                                        setError('Failed to load image. Please try downloading instead.');
                                                                    }}
                                                                />
                                                                <a
                                                                    href={selectedStudentFile}
                                                                    download={submission.filename}
                                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                                >
                                                                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                                                    Download Image
                                                                </a>
                                                            </>
                                                        )}
                                                        
                                                        {/\.docx$/i.test(submission.filename) && (
                                                            <DocxViewer
                                                                fileUrl={selectedStudentFile}
                                                                filename={submission.filename}
                                                            />
                                                        )}
                                                        
                                                        {/\.doc$/i.test(submission.filename) && (
                                                            <div className="text-center">
                                                                <p className="text-gray-600 mb-4">Legacy .doc files cannot be previewed. Please download to view.</p>
                                                                <a
                                                                    href={selectedStudentFile}
                                                                    download={submission.filename}
                                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                                >
                                                                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                                                    Download Document
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                              
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Evaluation Modal */}
                <EvaluationModal 
                    isOpen={showEvaluationModal}
                    onClose={() => {
                        setShowEvaluationModal(false);
                        setSelectedSubmission(null);
                    }}
                    studentSubmission={selectedSubmission}
                    examId={examId}
                />
            </div>
        </DashboardLayout>
    );
};

export default StudentSubmissionsPage;
