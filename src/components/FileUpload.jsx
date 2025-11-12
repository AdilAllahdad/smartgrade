import { useState } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

export default function FileUpload({ accept, label, onUpload, description }) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    const handleFile = (file) => {
        if (file) {
            setFileName(file.name);
            onUpload(file);
        }
    };

    return (
        <div
            className={`relative border-2 border-dashed rounded-lg p-6 ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept={accept}
                onChange={handleFileInput}
            />
            <div className="text-center">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                    <span className="text-sm font-medium text-blue-600">
                        {fileName ? fileName : 'Upload a file'}
                    </span>
                    {!fileName && (
                        <p className="text-xs text-gray-500">
                            {description || 'Drag and drop or click to select'}
                        </p>
                    )}
                </div>
                <div className="mt-2">
                    <span className="text-sm text-gray-500">{label}</span>
                </div>
            </div>
        </div>
    );
}
