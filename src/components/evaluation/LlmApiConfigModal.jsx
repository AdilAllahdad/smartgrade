import React, { useState } from 'react';

/**
 * Dialog for configuring the LLM API URL
 */
const LlmApiConfigModal = ({ isOpen, onClose, onSave }) => {
  const [apiUrl, setApiUrl] = useState(
    sessionStorage.getItem('llmApiUrl') || 
    import.meta.env.VITE_LLM_API_URL || 
    ''
  );

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiUrl) {
      sessionStorage.setItem('llmApiUrl', apiUrl);
      onSave(apiUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Configure AI Evaluation API</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Enter the ngrok URL from your FastAPI LLM evaluation service.
            This is displayed when you run your Python notebook.
          </p>
          
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API URL
          </label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://your-ngrok-url.ngrok-free.app"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> The ngrok URL changes each time you restart your Python notebook.
            Make sure to update it whenever you restart your evaluation service.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default LlmApiConfigModal;
