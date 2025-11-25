import React, { useState } from 'react';

// Eye icon SVG component
const EyeIcon = ({ onClick }) => (
    <button type="button" onClick={onClick} className="ml-2 p-1 hover:bg-gray-200 rounded" title="Preview Document">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
    </button>
);

const ExamPaperUpload = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [semester, setSemester] = useState('');
    const [section, setSection] = useState('');

    const [showPreview, setShowPreview] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handlePreview = (e) => {
        e.preventDefault();
        if (file) setShowPreview(true);
    };

    const closePreview = () => setShowPreview(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title || !semester || !section) {
            setError('Please select a file, enter a title, semester, and section');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const formData = new FormData();
            formData.append('title', title);
            formData.append('file', file);
            formData.append('semester', semester);
            formData.append('section', section);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exam-papers/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload exam paper');
            }

            // Reset form
            setFile(null);
            setTitle('');
            setSemester('');
            setSection('');
            alert('Exam paper uploaded successfully!');
        } catch (error) {
            setError('Error uploading exam paper: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Upload Exam Paper</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleUpload}>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter exam paper title"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Semester</label>
                    <input
                        type="text"
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter semester (e.g., 7)"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Section</label>
                    <input
                        type="text"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter section (e.g., A)"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">File</label>
                    <div className="flex items-center">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="w-full p-2 border rounded"
                            accept=".pdf,.doc,.docx"
                        />
                        {file && <EyeIcon onClick={handlePreview} />}
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'Uploading...' : 'Upload Exam Paper'}
                </button>
            </form>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-4 relative">
                        <button onClick={closePreview} className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl">&times;</button>
                        <h3 className="text-lg font-semibold mb-2">Document Preview</h3>
                        {file && file.type === 'application/pdf' ? (
                            <iframe
                                src={URL.createObjectURL(file)}
                                title="PDF Preview"
                                className="w-full h-96 border rounded"
                            />
                        ) : file && (file.name.endsWith('.doc') || file.name.endsWith('.docx')) ? (
                            <div className="text-center p-4">
                                <p className="mb-2">Preview for Word documents is not supported in browser.</p>
                                <a
                                    href={URL.createObjectURL(file)}
                                    download={file.name}
                                    className="text-blue-600 underline"
                                >
                                    Download and view
                                </a>
                            </div>
                        ) : (
                            <p>No preview available for this file type.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamPaperUpload;
