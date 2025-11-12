import React from 'react';

const EvaluationResults = ({ results }) => {
  if (!results) return null;

  // Handle case where results is a simple object
  if (!results.mcqResults && !results.shortQuestionResults) {
    return (
      <div className="mt-6 border rounded-lg p-4 bg-blue-50">
        <h4 className="font-semibold mb-2 text-lg">AI Evaluation Results:</h4>
        <div className="overflow-auto max-h-80">
          <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // Extract score summary
  const {
    mcqObtained = 0,
    mcqTotal = 0,
    shortObtained = 0,
    shortTotal = 0,
    totalObtained = 0,
    totalMarks = 0
  } = results.scoreSummary || {};
  
  // Calculate percentages
  const mcqPercentage = mcqTotal ? Math.round((mcqObtained / mcqTotal) * 100) : 0;
  const shortPercentage = shortTotal ? Math.round((shortObtained / shortTotal) * 100) : 0;
  const totalPercentage = totalMarks ? Math.round((totalObtained / totalMarks) * 100) : 0;

  return (
    <div className="mt-6 border rounded-lg p-4 bg-blue-50">
      <h4 className="font-semibold mb-4 text-lg text-center">AI Evaluation Results</h4>
      
      {/* Score Summary Card */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h5 className="text-lg font-semibold text-center mb-4">Score Summary</h5>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-gray-600">MCQs</div>
            <div className="text-xl font-bold">{mcqObtained} / {mcqTotal}</div>
            <div className="text-sm text-blue-600">{mcqPercentage}%</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">Short Questions</div>
            <div className="text-xl font-bold">{shortObtained} / {shortTotal}</div>
            <div className="text-sm text-green-600">{shortPercentage}%</div>
          </div>
          <div className="text-center bg-gray-50 rounded p-2">
            <div className="text-gray-700 font-semibold">Total Score</div>
            <div className="text-2xl font-bold text-indigo-700">{totalObtained} / {totalMarks}</div>
            <div className="text-sm font-semibold text-indigo-600">{totalPercentage}%</div>
          </div>
        </div>
      </div>
      
      {/* MCQ Results */}
      {results.mcqResults && results.mcqResults.length > 0 && (
        <div className="mb-6">
          <h5 className="font-semibold mb-2">MCQ Evaluation</h5>
          <div className="overflow-auto max-h-60 bg-white rounded border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Answer</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct Answer</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.mcqResults.map((mcq, index) => (
                  <tr key={index} className={mcq.correct ? "bg-green-50" : "bg-red-50"}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{mcq.id}</td>
                    <td className="px-3 py-2 text-sm">{mcq.question?.substring(0, 50)}...</td>
                    <td className="px-3 py-2 text-sm font-medium">{mcq.studentAnswer}</td>
                    <td className="px-3 py-2 text-sm font-medium">{mcq.correctAnswer}</td>
                    <td className="px-3 py-2 text-sm text-center">{mcq.obtainedMarks} / {mcq.marks}</td>
                    <td className="px-3 py-2 text-sm">
                      {mcq.correct ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Incorrect
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Short Questions Results */}
      {results.shortQuestionResults && results.shortQuestionResults.length > 0 && (
        <div>
          <h5 className="font-semibold mb-2">Short Questions Evaluation</h5>
          <div className="space-y-4">
            {results.shortQuestionResults.map((q, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex justify-between items-start">
                  <h6 className="font-semibold text-sm mb-1">Question {q.id}</h6>
                  <div className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {q.obtainedMarks} / {q.marks}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{q.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500 mb-1">Student Answer:</p>
                    <p className="text-sm">{q.studentAnswer || <em className="text-gray-400">No answer provided</em>}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500 mb-1">Model Answer:</p>
                    <p className="text-sm">{q.correctAnswer}</p>
                  </div>
                </div>
                {q.feedback && (
                  <div className="mt-2 text-sm bg-yellow-50 p-2 rounded border border-yellow-200">
                    <span className="font-semibold text-yellow-800">Feedback: </span>
                    {q.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Raw JSON for debugging */}
      <div className="mt-4 border-t pt-4">
        <details>
          <summary className="text-sm text-gray-500 cursor-pointer">Show Raw Response Data</summary>
          <div className="mt-2">
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-4 rounded border overflow-auto max-h-60">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
};

export default EvaluationResults;
