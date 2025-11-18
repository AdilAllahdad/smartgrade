import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { registerUser } from '../services/api';

const AddUserModal = ({ onClose, onSubmit, role }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        Add New {role.charAt(0).toUpperCase() + role.slice(1)}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {role === 'teacher' && (
                        <>
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {role === 'student' && (
                        <>
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">
                                    Roll Number
                                </label>
                                <input
                                    type="text"
                                    id="registrationNumber"
                                    name="registrationNumber"
                                    value={formData.registrationNumber}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                                    Semester
                                </label>
                                <input
                                    type="text"
                                    id="semester"
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                                    Section
                                </label>
                                <input
                                    type="text"
                                    id="section"
                                    name="section"
                                    value={formData.section}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            
                            <div className="pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Guardian Information</h4>
                                <div>
                                    <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700">
                                        Guardian Name
                                    </label>
                                    <input
                                        type="text"
                                        id="guardianName"
                                        name="guardianName"
                                        value={formData.guardianName}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="mt-4">
                                    <label htmlFor="guardianEmail" className="block text-sm font-medium text-gray-700">
                                        Guardian Email
                                    </label>
                                    <input
                                        type="email"
                                        id="guardianEmail"
                                        name="guardianEmail"
                                        value={formData.guardianEmail}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="mt-4">
                                    <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700">
                                        Guardian Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="guardianPhone"
                                        name="guardianPhone"
                                        value={formData.guardianPhone}
                                        onChange={handleInputChange}
                                        placeholder="+923001234567 or 03001234567"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Used for SMS notifications about exam results
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500">
                                        Guardian will receive the same password as the student
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
