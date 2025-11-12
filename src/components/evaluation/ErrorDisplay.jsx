import React from 'react';

const ErrorDisplay = ({ message, retry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[600px] text-center">
      <div className="text-red-600 mb-4">
        {message}
      </div>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry Loading
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
