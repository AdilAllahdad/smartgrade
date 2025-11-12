import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser } from '../services/authService';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [authState, setAuthState] = useState({
        user: null,
        isAuthenticated: false,
        loading: true
    });

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setAuthState({
                    user: userData,
                    isAuthenticated: true,
                    loading: false
                });
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                localStorage.removeItem('user');
                setAuthState(prev => ({ ...prev, loading: false }));
            }
        } else {
            setAuthState(prev => ({ ...prev, loading: false }));
        }
    }, []);

    const login = async (loginData) => {
        setAuthState(prev => ({ ...prev, loading: true }));
        
        try {
            // Clear any existing auth data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            
            const { user, error } = await loginUser(loginData);
            
            if (error) {
                throw new Error(error);
            }

            if (!user || !user.token) {
                throw new Error('Invalid login response');
            }

            const userData = {
                ...user,
                role: user.role || loginData.role // Use role from loginData
            };

            // Store user in localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', user.token);

            // Update auth state
            setAuthState({
                user: userData,
                isAuthenticated: true,
                loading: false
            });

            return userData;
        } catch (error) {
            console.error('AuthContext login error:', error);
            console.error('Error occurred with login data:', loginData);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Clear auth state on error
            setAuthState({
                user: null,
                isAuthenticated: false,
                loading: false
            });
            
            // Clear any stored data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            
            throw error;
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
            setAuthState({
                user: null,
                isAuthenticated: false,
                loading: false
            });
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const value = {
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
        loading: authState.loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!authState.loading ? children : null}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
