import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    DocumentTextIcon, 
    DocumentArrowDownIcon, 
    PencilSquareIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowsPointingOutIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import WriteNoteModal from './WriteNoteModal';

const ExamComparisonView = ({ examId, studentId }) => {
    const [answerSheet, setAnswerSheet] = useState(null);
    const [studentSubmission, setStudentSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [currentNote, setCurrentNote] = useState({ text: '', position: { x: 0, y: 0 } });
    const [notes, setNotes] = useState([]);
    const [score, setScore] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [fullscreenPreview, setFullscreenPreview] = useState(null);
    const { user } = useAuth();
    
    const answerSheetRef = useRef(null);
    const studentSubmissionRef = useRef(null);

    useEffect(() => {
        if (examId && studentId) {
            fetchDocuments();
        }
    }, [examId, studentId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            
            // Fetch the answer sheet for this exam
            const answerSheetResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/answer-sheets/exam/${examId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Fetch the student's submission for this exam
            const studentSubmissionResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student-submissions/exam/${examId}/student/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!answerSheetResponse.ok) {
                throw new Error('Failed to fetch answer sheet');
            }

            if (!studentSubmissionResponse.ok) {
                throw new Error('Failed to fetch student submission');
            }

            const answerSheetData = await answerSheetResponse.json();
            const studentSubmissionData = await studentSubmissionResponse.json();

            setAnswerSheet(answerSheetData);
            setStudentSubmission(studentSubmissionData);
            
            // Load any existing notes and score
            if (studentSubmissionData.notes) {
                setNotes(studentSubmissionData.notes);
            }
            
            if (studentSubmissionData.score !== undefined) {
                setScore(studentSubmissionData.score);
            }
            
        } catch (error) {
            console.error('Error fetching documents:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = (e, documentType) => {
        // Get position relative to the document
        const ref = documentType === 'answerSheet' ? answerSheetRef.current : studentSubmissionRef.current;
        const rect = ref.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setCurrentNote({
            text: '',
            position: { x, y },
            documentType
        });
        
        setShowNoteModal(true);
    };

    const saveNote = async (noteText) => {
        if (!noteText.trim()) return;
        
        const newNote = {
            ...currentNote,
            text: noteText,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        
        const updatedNotes = [...notes, newNote];
        setNotes(updatedNotes);
        
        try {
            // Save note to the backend
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student-submissions/${studentSubmission._id}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ notes: updatedNotes })
            });
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    const handleScoreChange = (e) => {
        setScore(e.target.value);
    };

    const saveScore = async () => {
        if (score === null) return;
        
        try {
            setIsSaving(true);
            
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student-submissions/${studentSubmission._id}/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ score })
            });
            
            // Show success message or update UI
        } catch (error) {
            console.error('Error saving score:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const renderPDF = (url, containerRef, documentType) => {
        return (
            <div 
                className="relative bg-white shadow-md rounded-lg overflow-hidden" 
                style={{ height: '700px' }}
                onClick={(e) => user?.role === 'teacher' && handleAddNote(e, documentType)}
                ref={containerRef}
            >
                <div className="absolute top-0 right-0 z-10 p-2">
                    <button 
                        onClick={() => setFullscreenPreview({ url, documentType })}
                        className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                    >
                        <ArrowsPointingOutIcon className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
                <iframe 
                    src={`${url}#toolbar=0`} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none' }} 
                    title={documentType === 'answerSheet' ? 'Answer Sheet' : 'Student Submission'}
                />
                
                {/* Render notes for this document */}
                {notes.filter(note => note.documentType === documentType).map(note => (
                    <div 
                        key={note.id} 
                        className="absolute bg-yellow-100 p-2 rounded shadow-md text-sm border border-yellow-400 max-w-xs"
                        style={{ 
                            top: `${note.position.y}px`, 
                            left: `${note.position.x}px`,
                            zIndex: 20
                        }}
                    >
                        {note.text}
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading documents...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load documents</h3>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (!answerSheet || !studentSubmission) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <ExclamationCircleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-yellow-800 mb-2">No documents available</h3>
                <p className="text-yellow-600">Either the answer sheet or student submission is missing.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-6 rounded-xl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Comparison</h2>
                <div className="flex items-center space-x-4">
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {answerSheet.examPaper?.subject || 'Subject: N/A'}
                    </div>
                    <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                        Student: {studentSubmission.student?.name || studentId}
                    </div>
                </div>
            </div>

            {user?.role === 'teacher' && (
                <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Grading Section</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <label htmlFor="score" className="mr-3 font-medium text-gray-700">Score:</label>
                            <input 
                                type="number" 
                                id="score"
                                min="0"
                                max="100"
                                value={score || ''}
                                onChange={handleScoreChange}
                                className="w-20 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-600">/ 100</span>
                        </div>
                        <button 
                            onClick={saveScore}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors disabled:bg-gray-400"
                        >
                            {isSaving ? (
                                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                            ) : (
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                            )}
                            Save Score
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <div className="mb-4 flex justify-between items-center">
                        <h3 className="text-lg font-medium flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                            Teacher's Answer Sheet
                        </h3>
                        <a 
                            href={answerSheet.fileUrl} 
                            download
                            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                        >
                            <DocumentArrowDownIcon className="h-5 w-5 mr-1" />
                            Download
                        </a>
                    </div>
                    {renderPDF(answerSheet.fileUrl, answerSheetRef, 'answerSheet')}
                </div>

                <div>
                    <div className="mb-4 flex justify-between items-center">
                        <h3 className="text-lg font-medium flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-2" />
                            Student's Submission
                        </h3>
                        <a 
                            href={studentSubmission.fileUrl} 
                            download
                            className="text-purple-600 hover:text-purple-800 flex items-center text-sm"
                        >
                            <DocumentArrowDownIcon className="h-5 w-5 mr-1" />
                            Download
                        </a>
                    </div>
                    {renderPDF(studentSubmission.fileUrl, studentSubmissionRef, 'studentSubmission')}
                </div>
            </div>

            {/* Fullscreen Preview Modal */}
            {fullscreenPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="relative bg-white rounded-lg w-full max-w-4xl h-[90vh]">
                        <div className="absolute top-4 right-4 z-50">
                            <button 
                                onClick={() => setFullscreenPreview(null)}
                                className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                            >
                                <XCircleIcon className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>
                        <iframe 
                            src={fullscreenPreview.url} 
                            width="100%" 
                            height="100%" 
                            className="rounded-lg"
                            style={{ border: 'none' }} 
                            title={`Fullscreen ${fullscreenPreview.documentType === 'answerSheet' ? 'Answer Sheet' : 'Student Submission'}`}
                        />
                    </div>
                </div>
            )}

            {/* Note Modal */}
            {showNoteModal && (
                <WriteNoteModal 
                    onClose={() => setShowNoteModal(false)} 
                    onSave={saveNote}
                    initialNote={currentNote.text}
                />
            )}
        </div>
    );
};

export default ExamComparisonView;
