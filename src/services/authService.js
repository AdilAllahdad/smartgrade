import api from './api';

export const loginUser = async (loginData) => {
    try {
        // Validate input
        if (!loginData.role || (!loginData.email && !loginData.rollNumber) || !loginData.password) {
            return { error: 'All required fields must be provided' };
        }

        // Call the backend API for login verification
        const response = await api.post('/auth/login', {
            ...loginData,
            role: loginData.role.toLowerCase()
        });
        
        const { success, message, user } = response.data;
        
        // Validate response data
        if (!success || !user || !user.token) {
            return { error: message || 'Invalid response from server' };
        }
        
        // Validate role matches
        if (user.role.toLowerCase() !== loginData.role.toLowerCase()) {
            return { error: 'Invalid login attempt. Please use the correct login form for your role.' };
        }

        // Store authentication data and return success
        // Make sure we capture all important fields
        const userData = {
            ...user,
            role: user.role,
            // Make sure studentId is included for guardian users
            ...(user.studentId && { studentId: user.studentId }) 
        };
        
        console.log('Storing user data:', userData);
        
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return {
            user: userData,
            error: null
        };
    } catch (error) {
        // Clean up any partial auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Enhanced error logging for debugging
        console.error('AuthService login error:', error);
        console.error('Login attempted with:', {
            ...loginData,
            password: loginData.password ? '[REDACTED]' : '[MISSING]'
        });
        
        // Log response data if available
        if (error.response) {
            console.error('Server response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers
            });
        }

        // Return structured error response with detailed message
        const errorMessage = error.response?.data?.message || error.message || 'Invalid credentials. Please try again.';
        console.error('Final error message:', errorMessage);
        
        return {
            user: null,
            error: errorMessage
        };
    }
};

export const registerUser = async (name, email, password, role = 'student') => {
    try {
        const response = await api.post('/auth/register', { name, email, password, role });
        const data = response.data;
        if (data.token) {
            localStorage.setItem('user', JSON.stringify(data));
        }
        return {
            user: data,
            error: null
        };
    } catch (error) {
        return {
            user: null,
            error: error.response?.data?.message || error.message
        };
    }
};

export const logoutUser = async () => {
    try {
        localStorage.removeItem('user');
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

export const createAdmin = async (adminData) => {
    try {
        const response = await api.post('/auth/create-admin', adminData);
        
        // If we get a response but it indicates failure
        if (response.data && !response.data.success) {
            return {
                success: false,
                user: null,
                error: response.data.message || 'Failed to create admin'
            };
        }

        // Successful response
        return {
            success: true,
            user: response.data.data,
            error: null
        };
    } catch (error) {
        // Handle network errors or server errors
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create admin';
        console.log('Error in createAdmin:', { error, message: errorMessage });
        return {
            success: false,
            user: null,
            error: errorMessage
        };
    }
};

export const getUsers = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await api.get('/auth/users', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.data) {
            throw new Error('No data received from server');
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load users';
        throw new Error(errorMessage);
    }
};

export const createUser = async (userData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await api.post('/auth/users', userData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.data) {
            throw new Error('No data received from server');
        }

        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create user';
        throw new Error(errorMessage);
    }
};

export const deleteUser = async (userId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await api.delete(`/auth/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error deleting user:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
        throw new Error(errorMessage);
    }
};
