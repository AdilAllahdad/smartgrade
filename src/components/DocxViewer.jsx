import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const DocxViewer = ({ fileUrl, filename }) => {
    const [htmlContent, setHtmlContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const convertDocxToHtml = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch the DOCX file with authorization header
                const response = await fetch(fileUrl, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch document');
                }

                // Convert the file to ArrayBuffer
                const arrayBuffer = await response.arrayBuffer();

                // Convert DOCX to HTML using mammoth
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setHtmlContent(result.value);
            } catch (err) {
                console.error('Error converting DOCX:', err);
                setError('Failed to convert document. Please try downloading instead.');
            } finally {
                setLoading(false);
            }
        };

        if (fileUrl) {
            convertDocxToHtml();
        }
    }, [fileUrl]);

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 mx-auto mb-2 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                <p className="text-gray-600">Converting document...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center space-y-4">
                <p className="text-red-600">{error}</p>
                {/* <button
                    onClick={() => {
                        // Create a download link with authorization
                        const a = document.createElement('a');
                        a.href = fileUrl;
                        a.download = filename;
                        // Add authorization header to the request
                        fetch(fileUrl, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        })
                        .then(response => response.blob())
                        .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            a.href = url;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                        })
                        .catch(err => console.error('Download error:', err));
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    Download Original Document
                </button> */}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div 
                className="w-full border rounded bg-white p-6 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
            />
            <div className="flex justify-end">
                {/* <button
                    onClick={() => {
                        // Create a download link with authorization
                        const a = document.createElement('a');
                        a.href = fileUrl;
                        a.download = filename;
                        // Add authorization header to the request
                        fetch(fileUrl, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        })
                        .then(response => response.blob())
                        .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            a.href = url;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                        })
                        .catch(err => console.error('Download error:', err));
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    Download Original
                </button> */}
            </div>
        </div>
    );
};

export default DocxViewer;
