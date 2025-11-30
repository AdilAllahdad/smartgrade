import { useState } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, AcademicCapIcon, UserGroupIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { registerUser } from '../services/api';

const AddUserModal = ({ onClose, onSubmit, role }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    const [validationStatus, setValidationStatus] = useState({});
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: role,
        registrationNumber: '',
        semester: '',
        section: '',
        guardianName: '',
        guardianEmail: '',
        guardianPhone: ''
    });

    const validateForm = () => {
        if (role === 'teacher') {
            if (!formData.name || !formData.email || !formData.password) {
                setError('Name, email and password are required for teachers');
                return false;
            }
        } else if (role === 'student') {
            if (!formData.registrationNumber || !formData.password || !formData.name || !formData.email || !formData.semester || !formData.section) {
                setError('Name, email, roll number, semester, section and password are required for students');
                return false;
            }
            
            // Check if guardian information is provided
            if (!formData.guardianName || !formData.guardianEmail || !formData.guardianPhone) {
                setError('Guardian name, email and phone number are required for students');
                return false;
            }
            
            // Validate phone number format
            const phonePattern = /^(\+?\d{1,3})?[\s-]?\d{10,12}$/;
            const cleanPhone = formData.guardianPhone.replace(/[\s-]/g, '');
            if (!phonePattern.test(formData.guardianPhone) || cleanPhone.length < 10) {
                setError('Invalid phone number format. Use format: +923001234567 or 03001234567');
                return false;
            }
            
            // Validate roll number format with more flexibility (e.g., SP22-BSE-006, SP22-BSE-123, etc.)
            const rollNumberPattern = /^[FSP][ASP]\d{2}-[A-Z]{2,3}-\d{3,4}$/;
            if (!rollNumberPattern.test(formData.registrationNumber)) {
                setError('Invalid roll number format. Expected format: SP22-BSE-006 (or similar with 3-4 digits at the end)');
                return false;
            }
            
            // Check if the roll number already exists (this will be handled by the server)
        }
        return true;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Real-time validation feedback
        setError('');
        validateField(name, value);
    };

    const validateField = (name, value) => {
        let isValid = false;
        
        switch(name) {
            case 'email':
            case 'guardianEmail':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                break;
            case 'guardianPhone':
                const cleanPhone = value.replace(/[\s-]/g, '');
                isValid = cleanPhone.length >= 10 && /^(\+?\d{1,3})?\d{10,12}$/.test(value);
                break;
            case 'registrationNumber':
                isValid = /^[FSP][ASP]\d{2}-[A-Z]{2,3}-\d{3,4}$/.test(value);
                break;
            case 'password':
                isValid = value.length >= 6;
                break;
            default:
                isValid = value.length > 0;
        }
        
        setValidationStatus(prev => ({
            ...prev,
            [name]: isValid
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (!validateForm()) {
            return;
        }

        setError('');
        setLoading(true);

        try {
            // For students, check if roll number exists before proceeding
            if (formData.role === 'student' && formData.registrationNumber) {
                try {
                    // You can implement a checkRollNumber API endpoint or handle it in the createUser function
                    // For now, we'll handle it through the catch block of the main API call
                }
                catch (err) {
                    // This will be handled in the main catch block
                }
            }
            
            // Prepare user data based on role
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };

            if (role === 'student') {
                userData.rollNumber = formData.registrationNumber;
                userData.semester = formData.semester;
                userData.section = formData.section;
                
                // Make sure guardian information is properly formatted
                if (formData.guardianName && formData.guardianEmail && formData.guardianPhone) {
                    userData.guardian = {
                        name: formData.guardianName,
                        email: formData.guardianEmail,
                        phoneNumber: formData.guardianPhone
                        // Note: password is not needed here, server will use student password
                    };
                }
            }

            // Use the onSubmit prop (handleAddUser) to register the user
            // This will trigger the notification in AdminDashboard
            if (onSubmit) {
                await onSubmit(userData);
                onClose();
            }
        } catch (err) {
            console.error("Error creating user:", err);
            // Display the error message in the modal
            setError(err.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="relative w-full max-w-2xl shadow-2xl rounded-2xl bg-white transform transition-all animate-slideUp">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl px-6 py-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                {role === 'teacher' ? (
                                    <AcademicCapIcon className="h-6 w-6 text-white" />
                                ) : (
                                    <UserGroupIcon className="h-6 w-6 text-white" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white">
                                Add New {role.charAt(0).toUpperCase() + role.slice(1)}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all duration-200 bg-white bg-opacity-10"
                        >
                            <XMarkIcon className="h-6 w-6 stroke-2" />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mx-6 mt-4 text-sm text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg animate-shake">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {role === 'teacher' && (
                        <div className="space-y-5">
                            {/* Name Field */}
                            <div className="group">
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className={`h-5 w-5 transition-colors ${focusedField === 'name' ? 'text-blue-500' : 'text-gray-400'}`} />
                                    </div>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        onFocus={() => setFocusedField('name')}
                                        onBlur={() => setFocusedField('')}
                                        className="pl-10 pr-10 block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                        placeholder="Enter teacher's full name"
                                        required
                                    />
                                    {validationStatus.name && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="group">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className={`h-5 w-5 transition-colors ${focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'}`} />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField('')}
                                        className="pl-10 pr-10 block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                        placeholder="teacher@example.com"
                                        required
                                    />
                                    {validationStatus.email && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {role === 'student' && (
                        <div className="space-y-5">
                            {/* Grid Layout for Student Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Name Field */}
                                <div className="group">
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className={`h-5 w-5 transition-colors ${focusedField === 'name' ? 'text-blue-500' : 'text-gray-400'}`} />
                                        </div>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField('')}
                                            className="pl-10 pr-10 block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                            placeholder="Student's full name"
                                            required
                                        />
                                        {validationStatus.name && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="group">
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <EnvelopeIcon className={`h-5 w-5 transition-colors ${focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'}`} />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField('')}
                                            className="pl-10 pr-10 block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                            placeholder="student@example.com"
                                            required
                                        />
                                        {validationStatus.email && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Roll Number */}
                            <div className="group">
                                <label htmlFor="registrationNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Roll Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="registrationNumber"
                                        name="registrationNumber"
                                        value={formData.registrationNumber}
                                        onChange={handleInputChange}
                                        onFocus={() => setFocusedField('registrationNumber')}
                                        onBlur={() => setFocusedField('')}
                                        className="pr-10 block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                        placeholder="e.g., SP22-BSE-006"
                                        required
                                    />
                                    {validationStatus.registrationNumber && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Format: SP22-BSE-006</p>
                            </div>

                            {/* Semester and Section */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label htmlFor="semester" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Semester <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="semester"
                                        name="semester"
                                        value={formData.semester}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                        placeholder="e.g., 5"
                                        required
                                    />
                                </div>
                                <div className="group">
                                    <label htmlFor="section" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Section <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="section"
                                        name="section"
                                        value={formData.section}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                        placeholder="e.g., A"
                                        required
                                    />
                                </div>
                            </div>
                            
                            {/* Guardian Information Section */}
                            <div className="pt-5 border-t-2 border-gray-200">
                                <div className="flex items-center space-x-2 mb-4">
                                    <div className="bg-purple-100 p-2 rounded-lg">
                                        <UserGroupIcon className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <h4 className="text-base font-bold text-gray-800">Guardian Information</h4>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="group">
                                        <label htmlFor="guardianName" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Guardian Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <UserIcon className={`h-5 w-5 transition-colors ${focusedField === 'guardianName' ? 'text-purple-500' : 'text-gray-400'}`} />
                                            </div>
                                            <input
                                                type="text"
                                                id="guardianName"
                                                name="guardianName"
                                                value={formData.guardianName}
                                                onChange={handleInputChange}
                                                onFocus={() => setFocusedField('guardianName')}
                                                onBlur={() => setFocusedField('')}
                                                className="pl-10 pr-10 block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-purple-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                                placeholder="Guardian's full name"
                                                required
                                            />
                                            {validationStatus.guardianName && (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="guardianEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Guardian Email <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <EnvelopeIcon className={`h-5 w-5 transition-colors ${focusedField === 'guardianEmail' ? 'text-purple-500' : 'text-gray-400'}`} />
                                            </div>
                                            <input
                                                type="email"
                                                id="guardianEmail"
                                                name="guardianEmail"
                                                value={formData.guardianEmail}
                                                onChange={handleInputChange}
                                                onFocus={() => setFocusedField('guardianEmail')}
                                                onBlur={() => setFocusedField('')}
                                                className="pl-10 pr-10 block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-purple-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                                placeholder="guardian@example.com"
                                                required
                                            />
                                            {validationStatus.guardianEmail && (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="guardianPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Guardian Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <PhoneIcon className={`h-5 w-5 transition-colors ${focusedField === 'guardianPhone' ? 'text-purple-500' : 'text-gray-400'}`} />
                                            </div>
                                            <input
                                                type="tel"
                                                id="guardianPhone"
                                                name="guardianPhone"
                                                value={formData.guardianPhone}
                                                onChange={handleInputChange}
                                                onFocus={() => setFocusedField('guardianPhone')}
                                                onBlur={() => setFocusedField('')}
                                                placeholder="+923001234567 or 03001234567"
                                                className="pl-10 pr-10 block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-purple-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                                required
                                            />
                                            {validationStatus.guardianPhone && (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 flex items-start">
                                            <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            Used for SMS notifications about exam results
                                        </p>
                                    </div>
                                    
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                        <p className="text-xs text-purple-800 flex items-start">
                                            <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            Guardian will receive the same password as the student
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Password Field */}
                    <div className="group">
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockClosedIcon className={`h-5 w-5 transition-colors ${focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'}`} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField('')}
                                className="pl-10 pr-10 block w-full rounded-lg border-2 border-gray-300 py-3 focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-400"
                                placeholder="Enter secure password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <div className="mt-2 flex items-start space-x-2">
                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                formData.password.length === 0 ? 'bg-gray-200' :
                                formData.password.length < 6 ? 'bg-red-400' :
                                formData.password.length < 10 ? 'bg-yellow-400' :
                                'bg-green-400'
                            }`}></div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            {formData.password.length === 0 ? 'Password strength: Not set' :
                             formData.password.length < 6 ? 'Password strength: Weak (min 6 characters)' :
                             formData.password.length < 10 ? 'Password strength: Medium' :
                             'Password strength: Strong'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding...
                                </span>
                            ) : (
                                `Add ${role.charAt(0).toUpperCase() + role.slice(1)}`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
