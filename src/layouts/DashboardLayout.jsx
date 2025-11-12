import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DashboardLayout({ children, allowedRoles }) {
    const { user, isAuthenticated, loading } = useAuth();

    // Show nothing while checking authentication
    if (loading) {
        return null;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to dashboard if user doesn't have required role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
}
