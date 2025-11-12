import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
    Bars3Icon,
    XMarkIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Header() {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (        <header className="bg-gradient-to-r from-blue-500 to-purple-700 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">                    <div className="flex items-center">
                        <Link to="/dashboard" className="flex items-center space-x-3">
                            <span className="text-3xl font-extrabold tracking-wider text-white opacity-90">SmartGrade</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <UserCircleIcon className="h-6 w-6 text-white" />
                            <span className="text-lg font-semibold text-white">
                                {getGreeting()}, {user?.name || 'User'}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <ArrowRightOnRectangleIcon className="h-5 w-5 text-white" />
                            <span className="text-white font-medium">Logout</span>
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-md hover:bg-white/10 transition-colors"
                        >
                            {isMenuOpen ? (
                                <XMarkIcon className="h-6 w-6" />
                            ) : (
                                <Bars3Icon className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="md:hidden pb-3 pt-2">
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center space-x-2 px-2">
                                <UserCircleIcon className="h-6 w-6" />
                                <span className="font-medium">
                                    {getGreeting()}, {user?.name || 'User'}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
