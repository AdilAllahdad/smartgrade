import { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthState } from '../types/auth';
import { authService } from '../services/api';

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        loading: false
    });

    const login = async (email: string, password: string) => {
        setAuthState(prev => ({ ...prev, loading: true }));
        try {
            const response = await authService.login(email, password);
            localStorage.setItem('token', response.token);
            setAuthState({
                user: response.user,
                isAuthenticated: true,
                loading: false
            });
        } catch (error) {
            setAuthState(prev => ({ ...prev, loading: false }));
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setAuthState({
                user: null,
                isAuthenticated: false,
                loading: false
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ ...authState, login, logout }}>
            {children}
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
