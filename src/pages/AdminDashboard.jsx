import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { UserRoles } from '../types/auth';
import * as authService from '../services/authService';

// Import components
import StatsSection from '../components/admin/StatsSection';
import UserManagementSection from '../components/admin/UserManagementSection';
import DeleteConfirmationModal from '../components/admin/DeleteConfirmationModal';
import NotificationToast, { notificationAnimationStyle } from '../components/admin/NotificationToast';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);    
    const [showModal, setShowModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'student', or 'teacher'
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        userId: null,
        userName: '',
        userRole: '',
    });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: 'success', // 'success', 'error', 'info'
        icon: null
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        students: 0,
        teachers: 0
    });

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await authService.getUsers();
            
            // Sort users by createdAt date, newest first
            // If createdAt doesn't exist, put them at the end
            const sortedData = [...data].sort((a, b) => {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            setUsers(sortedData);
            setStats({
                totalUsers: data.length,
                students: data.filter(user => user.role === 'student').length,
                teachers: data.filter(user => user.role === 'teacher').length
            });
        } catch (err) {
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleAddUser = async (userData) => {
        try {
            let processedData = { ...userData };
            
            // Process student-specific data - the rollNumber is already correctly set in AddUserModal
            
            // Remove unnecessary fields
            if (userData.role === 'teacher') {
                delete processedData.registrationNumber;
                delete processedData.batch;
                delete processedData.department;
            }
            
            if (userData.role === 'student') {
                // Make sure we're not keeping both fields
                delete processedData.registrationNumber;
            }

            const newUser = await authService.createUser(processedData);
            
            // Update users state directly - add new user at the beginning of the array
            setUsers(prevUsers => [newUser, ...prevUsers]);
            
            // Update stats
            setStats(prevStats => ({
                totalUsers: prevStats.totalUsers + 1,
                students: newUser.role === 'student' ? prevStats.students + 1 : prevStats.students,
                teachers: newUser.role === 'teacher' ? prevStats.teachers + 1 : prevStats.teachers
            }));
            
            // Show success notification
            showNotification(`${newUser.name} has been successfully added as a ${newUser.role}.`, 'success');

            // Close the modal
            setShowModal(false);
            setSelectedRole('');
            
            return newUser;
        } catch (error) {
            console.error('Error creating user:', error);
            
            // Check for specific errors
            let errorMessage = 'Failed to create user';
            
            if (error.message) {
                if (error.message.includes('duplicate key error') && error.message.includes('rollNumber')) {
                    errorMessage = `Roll number is already in use. Please use a different roll number.`;
                } else if (error.message.includes('duplicate key error') && error.message.includes('email')) {
                    errorMessage = `Email address is already in use. Please use a different email.`;
                } else {
                    errorMessage = error.message;
                }
            }
            
            // Show error notification
            showNotification(errorMessage, 'error');
            
            // Rethrow the error to be handled by the modal
            throw new Error(errorMessage);
        }
    };
    
    // Show delete confirmation modal
    const showDeleteConfirmation = (userId, userName, userRole) => {
        setDeleteModal({
            isOpen: true,
            userId,
            userName,
            userRole,
        });
    };
    
    // Show notification helper function
    const showNotification = (message, type = 'success', duration = 5000) => {
        setNotification({
            show: true,
            message,
            type
        });
        
        // Auto hide notification after duration
        setTimeout(() => {
            setNotification(prev => ({...prev, show: false}));
        }, duration);
    };
    
    // Handle delete user
    const handleDeleteUser = async () => {
        try {
            setDeleteLoading(true);
            const userId = deleteModal.userId;
            const userRole = deleteModal.userRole;
            const userName = deleteModal.userName;
            
            // Call delete API
            await authService.deleteUser(userId);
            
            // Update users state directly
            setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
            
            // Update stats
            setStats(prevStats => ({
                totalUsers: prevStats.totalUsers - 1,
                students: userRole === 'student' ? prevStats.students - 1 : prevStats.students,
                teachers: userRole === 'teacher' ? prevStats.teachers - 1 : prevStats.teachers
            }));
            
            // Close the modal
            setDeleteModal({
                isOpen: false,
                userId: null,
                userName: '',
                userRole: '',
            });
            
            // Show success notification
            showNotification(`${userName} has been successfully deleted.`, 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            // Show error notification
            showNotification(error.message || 'Failed to delete user', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <DashboardLayout allowedRoles={[UserRoles.ADMIN]}>
            {/* Add the animation styles */}
            <style dangerouslySetInnerHTML={{ __html: notificationAnimationStyle }} />
            <div className="space-y-10">
                {/* Stats Section */}
                <StatsSection 
                    stats={stats} 
                    activeFilter={activeFilter} 
                    setActiveFilter={setActiveFilter} 
                />

                {/* User Management Section */}
                <UserManagementSection 
                    users={users}
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    showModal={showModal}
                    setShowModal={setShowModal}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    handleAddUser={handleAddUser}
                    showDeleteConfirmation={showDeleteConfirmation}
                    setNotification={setNotification}
                />
                
                {/* Delete Confirmation Modal */}
                <DeleteConfirmationModal 
                    deleteModal={deleteModal}
                    handleDeleteUser={handleDeleteUser}
                    setDeleteModal={setDeleteModal}
                    deleteLoading={deleteLoading}
                />
                
                {/* Success/Error Notification Toast */}
                <NotificationToast 
                    notification={notification}
                    setNotification={setNotification}
                />
            </div>
        </DashboardLayout>
    );
}
