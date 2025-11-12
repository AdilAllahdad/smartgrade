import React from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import DocxViewer from '../DocxViewer';

const DocumentViewer = ({ document, title }) => {
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">No {title.toLowerCase()} available</p>
      </div>
    );
  }

  return (
    <>
      {/\.pdf$/i.test(document.filename) ? (
        <div className="relative h-full">
          <iframe
            src={document.fileUrl}
            title={title}
            className="w-full h-full border rounded"
            onError={(e) => {
              console.error(`Failed to load ${title} PDF`, e);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden flex-col items-center justify-center absolute inset-0 bg-gray-100">
            <p className="text-red-600 mb-4">Failed to convert document. Please try downloading instead.</p>
            <a
              href={document.fileUrl || document.downloadUrl}
              download={document.filename}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Download Original Document
            </a>
          </div>
        </div>
      ) : /\.docx$/i.test(document.filename) ? (
        <div className="relative h-full">
          <DocxViewer
            fileUrl={document.fileUrl || document.downloadUrl}
            filename={document.filename}
          />
          <div className="flex flex-col items-center justify-center mt-4">
            <a
              href={document.fileUrl || document.downloadUrl}
              download={document.filename}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Download Original Document
            </a>
          </div>
        </div>
      ) : /\.(jpg|jpeg|png|gif)$/i.test(document.filename) ? (
        <div className="relative h-full">
          <img
            src={document.fileUrl}
            alt={title}
            className="max-w-full"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden flex-col items-center justify-center mt-4">
            <p className="text-red-600 mb-4">Failed to load image. Please try downloading instead.</p>
            <a
              href={document.fileUrl || document.downloadUrl}
              download={document.filename}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Download Original Document
            </a>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-600">Preview not available</p>
          <a
            href={document.fileUrl || document.downloadUrl}
            download={document.filename}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Download Original Document
          </a>
        </div>
      )}
    </>
  );
};

export default DocumentViewer;
