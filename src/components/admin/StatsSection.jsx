import React from 'react';
import StatCard from './StatCard';
import { UsersIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const StatsSection = ({ stats, activeFilter, setActiveFilter }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-indigo-100 text-indigo-800 p-1 rounded mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </span>
                Dashboard Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={UsersIcon}
                    color="border-blue-600"
                    bgColor="from-blue-500 to-blue-700"
                    iconColor="text-blue-300"
                    onClick={() => setActiveFilter('all')}
                    isActive={activeFilter === 'all'}
                />
                <StatCard
                    title="Students"
                    value={stats.students}
                    icon={AcademicCapIcon}
                    color="border-emerald-600"
                    bgColor="from-emerald-500 to-emerald-700"
                    iconColor="text-emerald-300"
                    onClick={() => setActiveFilter('student')}
                    isActive={activeFilter === 'student'}
                />
                <StatCard
                    title="Teachers"
                    value={stats.teachers}
                    icon={UserGroupIcon}
                    color="border-purple-600"
                    bgColor="from-purple-500 to-purple-700"
                    iconColor="text-purple-300"
                    onClick={() => setActiveFilter('teacher')}
                    isActive={activeFilter === 'teacher'}
                />
            </div>
        </div>
    );
};

export default StatsSection;
