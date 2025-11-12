import React from 'react';
import UserManagementHeader from './UserManagementHeader';
import UsersTable from './UsersTable';
import AddUserModal from '../../components/AddUserModal';

const UserManagementSection = ({ 
    users, 
    activeFilter, 
    setActiveFilter, 
    showModal, 
    setShowModal,
    selectedRole, 
    setSelectedRole, 
    handleAddUser,
    showDeleteConfirmation,
    setNotification
}) => {
    return (
        <div>
            <UserManagementHeader 
                activeFilter={activeFilter} 
                setActiveFilter={setActiveFilter}
                setShowModal={setShowModal}
                setSelectedRole={setSelectedRole}
                setNotification={setNotification}
            />
            
            {/* Add User Modal */}
            {showModal && (
                <AddUserModal
                    onClose={() => {
                        setShowModal(false);
                        setSelectedRole('');
                    }}
                    onSubmit={handleAddUser}
                    role={selectedRole}
                />
            )}

            <UsersTable 
                users={users} 
                activeFilter={activeFilter} 
                showDeleteConfirmation={showDeleteConfirmation} 
            />
        </div>
    );
};

export default UserManagementSection;
