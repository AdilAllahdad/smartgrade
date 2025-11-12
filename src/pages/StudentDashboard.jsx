import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ExamPapersList from '../components/ExamPapersList';
import StudentExamSubmission from '../components/StudentExamSubmission';
import {
    DocumentArrowUpIcon,
    ClockIcon,
    AcademicCapIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const [stats] = useState({
        completedExams: 12,
        upcomingExams: 3,
        averageScore: 85
    });
    
    const examPapersListRef = useRef(null);
    
    const refreshExamsList = () => {
        if (examPapersListRef.current) {
            examPapersListRef.current.fetchExamPapers();
        }
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${color}`}>
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 text-gray-600" />
                </div>
                <div className="ml-5">
                    <div className="text-sm font-medium text-gray-500">{title}</div>
                    <div className="mt-1 text-3xl font-semibold text-gray-900">
                        {value}
                        {title === 'Average Score' && '%'}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout allowedRoles={['student']}>
            <div className="space-y-8">
             

                

                {/* Exam Papers Section */}
                <div className="mb-8">
                    <ExamPapersList 
                        ref={examPapersListRef}
                        showResults={true}
                        onViewResult={(examId) => {
                            navigate(`/student/results/${examId}`);
                        }}
                    />
                </div>
                
                {/* Exam Submission Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6">Submit Your Completed Exam</h2>
                    <StudentExamSubmission onSubmitSuccess={refreshExamsList} />
                </div>
            </div>
        </DashboardLayout>
    );
}
