import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, bgColor, iconColor, onClick, isActive = false }) => (
    <div 
        className={`bg-gradient-to-br ${bgColor} rounded-lg shadow-md p-4 md:p-6 border-l-4 ${color} 
                  hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 
                  ${onClick ? 'cursor-pointer' : ''}
                  ${isActive ? 'ring-2 md:ring-4 ring-offset-2 ring-blue-300' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center">
            <div className={`flex-shrink-0 p-2 md:p-3 rounded-full ${iconColor} bg-opacity-20`}>
                <Icon className={`h-6 w-6 md:h-8 md:w-8 ${iconColor}`} />
            </div>
            <div className="ml-3 md:ml-5">
                <div className="text-xs md:text-sm font-medium text-gray-100">{title}</div>
                <div className="mt-1 text-2xl md:text-3xl font-bold text-white">{value}</div>
            </div>
            {isActive && (
                <div className="ml-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
        </div>
    </div>
);

export default StatCard;
