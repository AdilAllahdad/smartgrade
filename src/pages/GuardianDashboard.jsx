import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

const GuardianDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState(null);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log('GuardianDashboard - Current user:', user);
        
        const fetchStudentInfo = async () => {
            try {
                setLoading(true);
                
                // Check if user is defined
                if (!user) {
                    console.error('User is undefined');
                    setError('User authentication not found. Please log in again.');
                    setLoading(false);
                    return;
                }
                
                console.log('Guardian user details:', {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    studentId: user.studentId
                });
                
                if (!user.studentId) {
                    console.error('No student ID found in user data');
                    setError('Could not find associated student information. The guardian account may not be properly linked to a student.');
                    setLoading(false);
                    return;
                }
                
                console.log(`Attempting to fetch student with ID: ${user.studentId}`);
                
                // Fetch student information using the student ID from the guardian's token
                const studentResponse = await api.get(`/students/${user.studentId}`);
                console.log('Student info response:', studentResponse.data);
                setStudentInfo(studentResponse.data);

                // Fetch student's results
                const resultsResponse = await api.get(`/results/student/${user.studentId}`);
                console.log('Student results response:', resultsResponse.data);
                setResults(resultsResponse.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching guardian data:', err);
                setError(`Failed to load student information: ${err.message}`);
                setLoading(false);
            }
        };

        if (user && user.role === 'guardian') {
            fetchStudentInfo();
        } else {
            const errorMsg = !user ? 'User is not authenticated' : `User has incorrect role: ${user?.role || 'undefined'}`;
            console.error(errorMsg);
            setError('Invalid user role or missing authentication. Please log in as a guardian.');
            setLoading(false);
        }
    }, [user]);

    const viewResultDetails = (resultId) => {
        navigate(`/results/${resultId}`);
    };

    if (loading) {
        return (
            <DashboardLayout allowedRoles={['guardian']}>
                <div className="flex justify-center items-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout allowedRoles={['guardian']}>
                <div className="flex justify-center items-center py-8 sm:py-12 px-4">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full text-sm sm:text-base">
                        <p>{error}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout allowedRoles={['guardian']}>
            <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8">Guardian Dashboard</h1>
                
                {/* Student Information Card */}
                {studentInfo && (
                    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
                        <h2 className="text-base sm:text-lg font-semibold border-b pb-2 mb-3 sm:mb-4">Student Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600">Name:</p>
                                <p className="font-medium text-sm sm:text-base">{studentInfo.name}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600">Roll Number:</p>
                                <p className="font-medium text-sm sm:text-base">{studentInfo.rollNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600">Semester:</p>
                                <p className="font-medium text-sm sm:text-base">{studentInfo.semester}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600">Section:</p>
                                <p className="font-medium text-sm sm:text-base">{studentInfo.section}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Results Section */}
                <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold border-b pb-2 mb-3 sm:mb-4">Examination Results</h2>
                    
                    {results.length === 0 ? (
                        <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No examination results available yet.</p>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="block lg:hidden space-y-3">
                                {results.map((result) => (
                                    <div key={result._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                    {result.exam?.title || 'Untitled Exam'}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(result.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${
                                                result.percentage >= 80 ? 'bg-green-100 text-green-800' : 
                                                result.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                                                'bg-red-100 text-red-800'}`}>
                                                {result.percentage}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm text-gray-900">
                                                Score: <span className="font-medium">{result.score} / {result.maxScore}</span>
                                            </div>
                                            <button
                                                onClick={() => viewResultDetails(result._id)}
                                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {results.map((result) => (
                                            <tr key={result._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {result.exam?.title || 'Untitled Exam'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(result.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{result.score} / {result.maxScore}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${result.percentage >= 80 ? 'bg-green-100 text-green-800' : 
                                                        result.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                                                        'bg-red-100 text-red-800'}`}>
                                                        {result.percentage}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => viewResultDetails(result._id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default GuardianDashboard;