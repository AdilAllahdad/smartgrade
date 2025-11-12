import React, { useState } from 'react';

export default function AnswerSheetUpload() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [fileUrl, setFileUrl] = useState(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected);
        setMessage('');
        if (selected) {
            setFileUrl(URL.createObjectURL(selected));
        } else {
            setFileUrl(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage('Please select a file to upload.');
            return;
        }
        setUploading(true);
        try {
            // TODO: Implement actual upload logic (API call)
            // Example: await api.uploadAnswerSheet(file);
            setTimeout(() => {
                setMessage('Answer sheet uploaded successfully!');
                setUploading(false);
                setFile(null);
                setFileUrl(null);
            }, 1000);
        } catch (error) {
            setMessage('Failed to upload answer sheet.');
            setUploading(false);
        }
    };

    const handlePreview = (e) => {
        e.preventDefault();
        if (file) setShowPreview(true);
    };

    const closePreview = () => setShowPreview(false);

    // SVG Eye Icon
    const EyeIcon = () => (
        <button
            type="button"
            title="Preview file"
            onClick={handlePreview}
            className="ml-2 p-1 rounded hover:bg-gray-100 border border-gray-200"
            style={{ verticalAlign: 'middle' }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </button>
    );

    // Modal for preview
    const PreviewModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-4 max-w-2xl w-full relative">
                <button onClick={closePreview} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                <h4 className="text-lg font-semibold mb-2">Preview</h4>
                {file && file.type === 'application/pdf' && fileUrl && (
                    <iframe src={fileUrl} title="PDF Preview" className="w-full h-96 border rounded" />
                )}
                {file && (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') && (
                    <div className="text-gray-700">Preview for DOC/DOCX is not supported. Please download to view.</div>
                )}
                {!file || (!fileUrl && file.type !== 'application/pdf') && (
                    <div className="text-gray-500">No preview available.</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Answer Sheet</h3>
            <form onSubmit={handleUpload} className="flex flex-col gap-3">
                <div className="flex items-center">
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {file && <EyeIcon />}
                </div>
                <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {uploading ? 'Uploading...' : 'Upload Answer Sheet'}
                </button>
                {message && <div className="text-sm text-green-600 mt-1">{message}</div>}
            </form>
            {showPreview && <PreviewModal />}
        </div>
    );
}
