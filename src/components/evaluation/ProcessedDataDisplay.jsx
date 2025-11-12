import React from 'react';

const ProcessedDataDisplay = ({ processedData }) => {
  const { studentSubmission, answerSheet } = processedData;
  
  if (!studentSubmission.mcqs.length && !studentSubmission.shortQuestions.length) {
    return null;
  }

  return (
    <div className="mt-6 border rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold mb-2">Processed Data:</h4>
      <div className="text-xs overflow-auto max-h-60">
        <pre className="whitespace-pre-wrap">
          {JSON.stringify({
            studentSubmission: {
              mcqs: studentSubmission.mcqs,
              shortQuestions: studentSubmission.shortQuestions,
              metadata: studentSubmission.metadata
            },
            answerSheet: {
              mcqs: answerSheet.mcqs,
              shortQuestions: answerSheet.shortQuestions,
              metadata: answerSheet.metadata
            }
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ProcessedDataDisplay;
