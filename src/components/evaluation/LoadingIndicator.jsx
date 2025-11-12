import React from 'react';

const LoadingIndicator = () => {
  return (
    <div className="flex items-center justify-center h-[600px]">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  );
};

export default LoadingIndicator;
