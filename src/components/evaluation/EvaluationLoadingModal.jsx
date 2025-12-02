import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

const EvaluationLoadingModal = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-4">
          <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
        </div>
        <h3 className="text-xl font-semibold mb-2">AI Evaluation in Progress</h3>
        <p className="text-gray-600 mb-4">
          Our model is analyzing the student submission and generating detailed feedback...
        </p>
        <div className="bg-gray-100 p-3 rounded-lg text-left mb-4 text-sm">
          <p className="font-medium mb-1">Processing:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Analyzing MCQ responses</li>
            <li>Evaluating short answers using semantic similarity</li>
            <li>Generating constructive feedback</li>
            <li>Calculating final scores</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EvaluationLoadingModal;
