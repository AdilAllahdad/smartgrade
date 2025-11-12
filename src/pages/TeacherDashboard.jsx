import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import FileUpload from '../components/FileUpload';
import ExamAndAnswerUpload from '../components/ExamAndAnswerUpload';
import ExamPapersList from '../components/ExamPapersList';
import ExamComparisonView from '../components/ExamComparisonView';
import { downloadFile, TEMPLATES } from '../utils/fileDownload';
import {
    ClipboardDocumentCheckIcon,
    ChartBarIcon,
    DocumentTextIcon,
    UserGroupIcon,
    PlusIcon,
    ArrowUpTrayIcon,
    BookOpenIcon,
    CheckBadgeIcon,
    DocumentArrowDownIcon,
    DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function TeacherDashboard() {
    const [stats, setStats] = useState({
        totalExams: 0,
        pendingEvaluations: 0,
        studentsEvaluated: 0
    });

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadType, setUploadType] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState(null);
    const [selectedExam, setSelectedExam] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const examPapersListRef = useRef(null);

    // Function to refresh the exam papers list
    const refreshDocuments = () => {
        if (examPapersListRef.current) {
            examPapersListRef.current.fetchExamPapers();
        }
    };

    // Simulate data loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setStats({
                totalExams: 12,
                pendingEvaluations: 5,
                studentsEvaluated: 42
            });
            setIsLoading(false);
        }, 800);
        
        return () => clearTimeout(timer);
    }, []);

    // Animation variants for staggered animations
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const handleFileUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // TODO: Implement the API call to upload the file
            // const response = await api.uploadFile(formData, uploadType);
            
            // Show success message
            alert('File uploaded successfully!');
            setShowUploadModal(false);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, bgGradient }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className={`bg-white rounded-xl shadow-lg p-6 ${bgGradient} overflow-hidden relative`}
        >
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10 transform translate-x-8 -translate-y-8">
                <Icon className="h-full w-full" />
            </div>
            <div className="flex items-center relative z-10">
                <div className={`rounded-full p-3 ${color}`}>
                    <Icon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-5">
                    <div className="text-sm font-medium text-gray-500">{title}</div>
                    <div className="mt-1 text-3xl font-bold text-gray-900">{value}</div>
                </div>
            </div>
        </motion.div>
    );

    const UploadModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl border border-gray-100"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                        Upload {uploadType === 'answerSheet' ? 'Answer Sheet' : 'Question Paper'}
                    </h3>
                    <button
                        onClick={() => setShowUploadModal(false)}
                        className="text-gray-400 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100"
                    >
                        <span className="sr-only">Close</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <FileUpload
                    accept=".pdf,.doc,.docx"
                    label={`Upload ${uploadType === 'answerSheet' ? 'answer sheet' : 'question paper'} (PDF, DOC, DOCX)`}
                    onUpload={handleFileUpload}
                    description="Drag and drop your file here or click to browse"
                />
                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        onClick={() => setShowUploadModal(false)}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => setShowUploadModal(false)}
                        className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm transition-all ${uploadType === 'answerSheet' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                        Upload
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return (
        <DashboardLayout allowedRoles={['teacher']}>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading dashboard data...</p>
                </div>
            ) : (
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-12">
                {/* Welcome Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg"
                >
                    <h1 className="text-3xl font-bold mb-2">Welcome back, Teacher</h1>
                    <p className="opacity-90">Manage your exams, answer sheets and student evaluations all in one place</p>
                </motion.div>

                {/* Stats Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                        <span className="text-sm text-blue-600 font-medium hover:underline cursor-pointer">View Details</span>
                    </div>
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StatCard
                            title="Total Exams"
                            value={stats.totalExams}
                            icon={DocumentTextIcon}
                            color="bg-blue-600"
                            bgGradient="bg-gradient-to-br from-blue-50 to-white"
                        />
                        <StatCard
                            title="Pending Evaluations"
                            value={stats.pendingEvaluations}
                            icon={ClipboardDocumentCheckIcon}
                            color="bg-amber-600"
                            bgGradient="bg-gradient-to-br from-amber-50 to-white"
                        />
                        <StatCard
                            title="Students Evaluated"
                            value={stats.studentsEvaluated}
                            icon={UserGroupIcon}
                            color="bg-green-600"
                            bgGradient="bg-gradient-to-br from-green-50 to-white"
                        />
                    </div> */}
                </div>

                {/* Upload Section
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Exam Materials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setUploadType('answerSheet');
                                setShowUploadModal(true);
                            }}
                            className="group flex items-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all border border-blue-100"
                        >
                            <div className="p-4 rounded-full bg-blue-600 text-white group-hover:bg-blue-700 transition-colors">
                                <ArrowUpTrayIcon className="h-7 w-7" />
                            </div>
                            <div className="ml-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Upload Answer Sheet</h3>
                                <p className="text-sm text-gray-600">Upload special answer sheets for exams</p>
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setUploadType('questionPaper');
                                setShowUploadModal(true);
                            }}
                            className="group flex items-center p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all border border-purple-100"
                        >
                            <div className="p-4 rounded-full bg-purple-600 text-white group-hover:bg-purple-700 transition-colors">
                                <BookOpenIcon className="h-7 w-7" />
                            </div>
                            <div className="ml-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Upload Question Paper</h3>
                                <p className="text-sm text-gray-600">Upload exam question papers</p>
                            </div>
                        </motion.button>
                    </div>
                </div> */}

                {/* Format Downloads Section */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Format Templates</h2>
                    <p className="text-gray-600 mb-6">Please use these standardized templates when creating exam papers and answer sheets for better consistency and evaluation.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.button 
                            onClick={() => downloadFile(TEMPLATES.QUESTION_PAPER.url, TEMPLATES.QUESTION_PAPER.fileName)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group flex items-center p-6 bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all border border-indigo-100"
                        >
                            <div className="p-4 rounded-full bg-indigo-600 text-white group-hover:bg-indigo-700 transition-colors">
                                <DocumentArrowDownIcon className="h-7 w-7" />
                            </div>
                            <div className="ml-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Question Paper Format</h3>
                                <p className="text-sm text-gray-600">Download the standard question paper format template</p>
                            </div>
                        </motion.button>

                        <motion.button 
                            onClick={() => downloadFile(TEMPLATES.SPECIAL_ANSWER_SHEET.url, TEMPLATES.SPECIAL_ANSWER_SHEET.fileName)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group flex items-center p-6 bg-gradient-to-br from-cyan-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all border border-cyan-100"
                        >
                            <div className="p-4 rounded-full bg-cyan-600 text-white group-hover:bg-cyan-700 transition-colors">
                                <DocumentCheckIcon className="h-7 w-7" />
                            </div>
                            <div className="ml-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Answer Sheet Format</h3>
                                <p className="text-sm text-gray-600">Download the special answer sheet format template</p>
                            </div>
                        </motion.button>
                    </div>
                </div>

                {/* Quick Actions */}
                {/* <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <motion.button 
                            whileHover={{ y: -4 }}
                            className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100"
                        >
                            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mb-3">
                                <PlusIcon className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-gray-900">Create New Exam</span>
                        </motion.button>
                        
                        <motion.button 
                            whileHover={{ y: -4 }}
                            className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100"
                        >
                            <div className="p-3 rounded-full bg-green-100 text-green-600 mb-3">
                                <CheckBadgeIcon className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-gray-900">Grade Submissions</span>
                        </motion.button>
                        
                        <motion.button 
                            whileHover={{ y: -4 }}
                            className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100"
                        >
                            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mb-3">
                                <ChartBarIcon className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-gray-900">View Analytics</span>
                        </motion.button>
                    </div>
                </div> */}

                {/* Exam Papers Upload Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 space-y-4"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Upload Exam Papers</h2>
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                            New Feature
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                        <ExamAndAnswerUpload onUploadSuccess={refreshDocuments} />
                    </div>
                </motion.div>

                {/* Exam Papers List Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <p className="text-blue-700">
                                <span className="font-medium">Note:</span> You are viewing only the exam papers that you have uploaded.
                            </p>
                        </div>
                        <ExamPapersList 
                            ref={examPapersListRef}
                            onExamSelect={(examId, studentId) => {
                                setSelectedExam(examId);
                                setSelectedStudent(studentId);
                            }}
                        />
                    </div>
                </motion.div>

                {/* Exam Comparison View Section */}
                {selectedExam && selectedStudent && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-8"
                    >
                        <ExamComparisonView 
                            examId={selectedExam}
                            studentId={selectedStudent}
                        />
                    </motion.div>
                )}
            </motion.div>
            )}

            {/* Upload Modal */}
            {showUploadModal && <UploadModal />}
        </DashboardLayout>
    );
}
