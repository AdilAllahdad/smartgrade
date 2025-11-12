import React from 'react';
import { XCircleIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

// CSS Animation for notifications
export const notificationAnimationStyle = `
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translate3d(0, 40px, 0);
    }
    to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

@keyframes fadeOutDown {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
        transform: translate3d(0, 40px, 0);
    }
}

.animate-fade-in-up {
    animation: fadeInUp 0.45s ease-out;
}

.animate-fade-out-down {
    animation: fadeOutDown 0.45s ease-in forwards;
}
`;

const NotificationToast = ({ notification, setNotification }) => {
    if (!notification.show) return null;
    
    return (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out animate-fade-in-up">
            <div className={`relative p-4 rounded-lg shadow-xl ${
                notification.type === 'error' 
                    ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800' 
                    : 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 text-green-800'
            }`}>
                <div className="flex items-start">
                    <div className={`flex-shrink-0 ${
                        notification.type === 'error' ? 'text-red-500' : 'text-green-500'
                    }`}>
                        {notification.type === 'error' ? (
                            <XCircleIcon className="h-6 w-6" />
                        ) : (
                            <CheckCircleIcon className="h-6 w-6" />
                        )}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium">
                            {notification.type === 'error' ? "Error" : "Success"}
                        </p>
                        <p className="mt-1 text-sm">
                            {notification.message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={() => setNotification({...notification, show: false})}
                            className={`inline-flex rounded-md ${
                                notification.type === 'error' 
                                    ? 'text-red-400 hover:text-red-600 focus:ring-red-500' 
                                    : 'text-green-400 hover:text-green-600 focus:ring-green-500'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationToast;
