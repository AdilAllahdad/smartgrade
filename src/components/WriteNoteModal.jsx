import React, { useState, useEffect, useRef } from 'react';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

const WriteNoteModal = ({ onClose, onSave, initialNote = '' }) => {
    const [note, setNote] = useState(initialNote);
    const textareaRef = useRef(null);

    useEffect(() => {
        // Auto-focus the textarea when the modal opens
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(note);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <PencilIcon className="h-5 w-5 text-blue-600 mr-2" />
                        Add Note
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-4">
                        <textarea
                            ref={textareaRef}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
                            placeholder="Write your note here..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                    
                    <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Save Note
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WriteNoteModal;
