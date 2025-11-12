import React from 'react';
import { PlusIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const UserManagementHeader = ({ activeFilter, setActiveFilter, setShowModal, setSelectedRole, setNotification }) => {
    return (
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <span className="bg-indigo-100 text-indigo-800 p-1 rounded mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </span>
                    User Management
                </h2>
                
                {/* Filter indicator */}
                {activeFilter !== 'all' && (
                    <div className="ml-4 flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            activeFilter === 'student' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}>
                            {activeFilter === 'student' ? 'Filtering: Students' : 'Filtering: Teachers'}
                        </span>
                        <button 
                            onClick={() => setActiveFilter('all')}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            
            {/* Add New User Button */}
            <div className="relative group">
                <button
                    className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add New User
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 w-64 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 invisible group-hover:visible transition-all duration-300 opacity-0 group-hover:opacity-100 z-10 mt-2">
                    <div className="py-2 divide-y divide-gray-100" role="menu" aria-orientation="vertical">
                        {/* Teacher Option */}
                        <button
                            onClick={() => {
                                setSelectedRole('teacher');
                                setShowModal(true);
                                // Reset any previous errors
                                setNotification(prev => ({...prev, show: false}));
                            }}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 w-full transition-colors duration-150"
                        >
                            <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium">Add Teacher</div>
                                <div className="text-xs text-gray-500 mt-0.5">Add a new teacher to the system</div>
                            </div>
                        </button>
                        
                        {/* Student Option */}
                        <button
                            onClick={() => {
                                setSelectedRole('student');
                                setShowModal(true);
                                // Reset any previous errors
                                setNotification(prev => ({...prev, show: false}));
                            }}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 w-full transition-colors duration-150"
                        >
                            <div className="bg-emerald-100 p-2 rounded-full mr-3">
                                <AcademicCapIcon className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium">Add Student</div>
                                <div className="text-xs text-gray-500 mt-0.5">Add a new student to the system</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementHeader;
