import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaUserGraduate, FaChalkboardTeacher, FaUserShield, FaUserFriends } from 'react-icons/fa';

const RoleCard = ({ role, icon: Icon, title, description, isActive, onClick }) => (
    <div
        className={`relative overflow-hidden w-full max-w-sm bg-white rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 ${
            isActive ? 'ring-4 ring-blue-500 scale-105' : ''
        }`}
        onClick={onClick}
    >
        <div className="p-6">
            <div className="flex items-center justify-center mb-4">
                <Icon className={`h-16 w-16 ${
                    role === 'student' ? 'text-indigo-600' :
                    role === 'teacher' ? 'text-green-600' :
                    role === 'guardian' ? 'text-orange-600' :
                    'text-blue-600'
                }`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h3>
            <p className="text-gray-600 text-center">{description}</p>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${
            role === 'student' ? 'bg-indigo-600' :
            role === 'teacher' ? 'bg-green-600' :
            role === 'guardian' ? 'bg-orange-600' :
            'bg-blue-600'
        }`}></div>
    </div>
);

export default function HomePage() {
    const navigate = useNavigate();
    const [activeCard, setActiveCard] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        setShowWelcome(true);
    }, []);

    const handleRoleSelect = (role) => {
        setActiveCard(role);
        setTimeout(() => {
            navigate('/login', { state: { role } });
        }, 300);
    };

    const roles = [
        {
            id: 'student',
            icon: FaUserGraduate,
            title: 'Student',
            description: 'Submit and track your exam papers'
        },
        {
            id: 'teacher',
            icon: FaChalkboardTeacher,
            title: 'Teacher',
            description: 'Create and evaluate exam papers'
        },
        {
            id: 'guardian',
            icon: FaUserFriends,
            title: 'Guardian',
            description: 'View and monitor your child\'s academic progress'
        },
        {
            id: 'admin',
            icon: FaUserShield,
            title: 'Administrator',
            description: 'Manage users and system settings'
        }
    ];

    return (
        <div className="fixed inset-0 w-screen h-screen bg-[#1e3a8a] flex flex-col items-center justify-between overflow-hidden">
            {/* Header Section */}
            <div className={`w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 transform transition-all duration-1000 
                ${showWelcome ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-bold text-center mb-2 sm:mb-4">
                    SmartGrade
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 text-center font-light max-w-2xl">
                    Empowering Education Through Smart Evaluation
                </p>
            </div>

            {/* Role Selection Cards */}
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
                {roles.map((role) => (
                    <RoleCard
                        key={role.id}
                        role={role.id}
                        icon={role.icon}
                        title={role.title}
                        description={role.description}
                        isActive={activeCard === role.id}
                        onClick={() => handleRoleSelect(role.id)}
                    />
                ))}
            </div>

            {/* Footer Note */}
            <div className="w-full p-4 text-center text-blue-100 text-sm">
                © 2025 SmartGrade. All rights reserved.
            </div>
        </div>
    );
}
