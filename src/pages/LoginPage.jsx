import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUserGraduate, FaChalkboardTeacher, FaUserShield, FaUserFriends } from 'react-icons/fa';

const RoleIcon = ({ role }) => {
    switch (role) {
        case 'student':
            return <FaUserGraduate className="h-12 w-12 text-indigo-600" />;
        case 'teacher':
            return <FaChalkboardTeacher className="h-12 w-12 text-green-600" />;
        case 'guardian':
            return <FaUserFriends className="h-12 w-12 text-orange-600" />;
        case 'admin':
            return <FaUserShield className="h-12 w-12 text-blue-600" />;
        default:
            return null;
    }
};

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const role = location.state?.role || 'student';

    // Dropdown style for options
    const selectStyles = {
        option: "text-gray-900" // Dark text for dropdown options
    };

    const [credentials, setCredentials] = useState({
        rollNo: '',
        department: 'BBA',
        batch: 'FA01',
        password: '',
        email: ''
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Calculate formatted roll number
    const getFormattedRollNo = () => {
        const paddedRollNo = credentials.rollNo.padStart(3, '0');
        return `${credentials.batch}-${credentials.department}-${paddedRollNo}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return; // Prevent multiple submissions
        
        setError('');
        setIsLoading(true);
        
        try {
            let loginData;
            
            if (role === 'student') {
                const formattedRollNo = getFormattedRollNo();
                loginData = {
                    rollNumber: formattedRollNo,
                    password: credentials.password,
                    role: role
                };
            } else {
                loginData = {
                    email: credentials.email,
                    password: credentials.password,
                    role: role
                };
            }

            console.log('Sending login data:', loginData);
            
            const userData = await login(loginData);
            
            console.log('Received user data:', userData);
            
            if (!userData || !userData.role) {
                throw new Error('Invalid login response');
            }

            // Navigate based on the role returned from the server
            const redirectMap = {
                admin: '/admin',
                teacher: '/teacher',
                student: '/student',
                guardian: '/guardian'
            };

            const redirectPath = redirectMap[userData.role.toLowerCase()];
            console.log('Redirecting to:', redirectPath, 'based on role:', userData.role);
            
            if (redirectPath) {
                navigate(redirectPath);
            } else {
                throw new Error(`Invalid user role: ${userData.role}`);
            }
        } catch (err) {
            console.error('Login error:', err);
            console.error('Error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name,
                response: err.response?.data
            });
            
            // Display error with more detail in development mode
            setError(process.env.NODE_ENV === 'development' 
                ? `Login failed: ${err.message}` 
                : 'Failed to login. Please check your credentials.');
                
            // Reset loading state but keep form data for retry
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] flex">
            {/* Left Side - Decorative Area */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-black/20">
                <div className="max-w-2xl text-center">
                    <h1 className="text-5xl font-bold text-white mb-8">SmartGrade</h1>
                    <div className="flex justify-center mb-8">
                        <RoleIcon role={role} />
                    </div>
                    <p className="text-xl text-gray-300 mb-4">Transform Your Evaluation Experience</p>
                    <p className="text-gray-400">
                        {role === 'student' ? 'Access your exams and view results seamlessly' :
                         role === 'teacher' ? 'Manage and grade exams efficiently' :
                         role === 'guardian' ? 'Monitor your child\'s academic performance' :
                         'Control and oversee the entire evaluation system'}
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-lg mx-auto w-full">
                    <div className="flex justify-center lg:hidden mb-6">
                        <RoleIcon role={role} />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white mb-8">
                        {role.charAt(0).toUpperCase() + role.slice(1)} Login
                    </h2>

                    <div className="bg-white/10 backdrop-blur-lg py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-white/20">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {role === 'student' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="batch" className="block text-sm font-medium text-gray-200">
                                                Batch
                                            </label>
                                            <select
                                                id="batch"
                                                name="batch"
                                                value={credentials.batch}
                                                onChange={handleChange}
                                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white/[0.05] text-white [&>option]:bg-white [&>option]:text-gray-900"
                                            >
                                                <option value="FA19">FA19</option>
                                                <option value="SP20">SP20</option>
                                                <option value="FA20">FA20</option>
                                                <option value="SP21">SP21</option>
                                                <option value="FA21">FA21</option>
                                                <option value="SP22">SP22</option>
                                                <option value="FA22">FA22</option>
                                                <option value="SP23">SP23</option>
                                                <option value="FA23">FA23</option>
                                                <option value="SP24">SP24</option>
                                                <option value="FA24">FA24</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="department" className="block text-sm font-medium text-gray-200">
                                                Department
                                            </label>
                                            <select
                                                id="department"
                                                name="department"
                                                value={credentials.department}
                                                onChange={handleChange}
                                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white/[0.05] text-white [&>option]:bg-white [&>option]:text-gray-900"
                                            >
                                                <option value="BSE">BSE (Software Engineering)</option>
                                                <option value="BCS">BCS (Computer Science)</option>
                                                <option value="BBA">BBA (Business Administration)</option>
                                                <option value="BAF">BAF (Accounting & Finance)</option>
                                                <option value="BCE">BCE (Civil Engineering)</option>
                                                <option value="BEE">BEE (Electrical Engineering)</option>
                                                <option value="BME">BME (Mechanical Engineering)</option>
                                                <option value="BDS">BDS (Data Science)</option>
                                                <option value="BAI">BAI (Artificial Intelligence)</option>
                                                <option value="BCY">BCY (Cyber Security)</option>
                                            </select>
                                        </div>
                                    </div>                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label htmlFor="rollNo" className="block text-sm font-medium text-gray-200">
                                                Roll Number
                                            </label>
                                            <span className="text-sm font-medium text-indigo-400">
                                                {getFormattedRollNo()}
                                            </span>
                                        </div>
                                        <input
                                            id="rollNo"
                                            name="rollNo"
                                            type="text"
                                            required
                                            value={credentials.rollNo}
                                            onChange={handleChange}
                                            className="mt-1 block w-full px-3 py-2 bg-white/10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
                                        />
                                    </div>

                                    {/* Display formatted roll number */}
                                    {credentials.rollNo && (
                                        <div className="mt-2 text-sm text-gray-300">
                                            Formatted Roll Number: <span className="font-semibold">{getFormattedRollNo()}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                                        Email address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={credentials.email}
                                        onChange={handleChange}
                                        className="mt-1 block w-full px-3 py-2 bg-white/10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={credentials.password}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 bg-white/10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
                                />
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">
                                                {error}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                        ${role === 'student' ? 'bg-indigo-600 hover:bg-indigo-700' : 
                                          role === 'teacher' ? 'bg-green-600 hover:bg-green-700' : 
                                          role === 'guardian' ? 'bg-orange-600 hover:bg-orange-700' :
                                          'bg-blue-600 hover:bg-blue-700'}
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 
                                        ${role === 'student' ? 'focus:ring-indigo-500' : 
                                          role === 'teacher' ? 'focus:ring-green-500' : 
                                          role === 'guardian' ? 'focus:ring-orange-500' :
                                          'focus:ring-blue-500'}
                                        transition-colors duration-200
                                        ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? 'Signing in...' : 'Sign in'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-transparent text-gray-300">
                                        Not a {role}?
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white/5 text-sm font-medium text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    Return to Role Selection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
