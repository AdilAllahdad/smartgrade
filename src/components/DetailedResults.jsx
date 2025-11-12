{/* MCQ and Short Answer Results */}
<div className="space-y-4">
    {/* MCQ Results - Only show if evaluationDetails exists */}
    {result.evaluationResults.evaluationDetails && (
        <details open>
            <summary className="cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-100">
                Multiple Choice Questions {result.evaluationResults.evaluationDetails?.mcqResults ? `(${result.evaluationResults.evaluationDetails.mcqResults.length})` : '(0)'}
            </summary>
            <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
                {console.log('Rendering MCQ Results:', result.evaluationResults.evaluationDetails?.mcqResults)}
                {result.evaluationResults.evaluationDetails?.mcqResults?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Answer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct Answer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {result.evaluationResults.evaluationDetails.mcqResults.map((mcq) => (
                                    <tr key={mcq.questionNumber}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{mcq.questionNumber}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{mcq.studentAnswer}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{mcq.correctAnswer}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {mcq.isCorrect ? (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Correct
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Incorrect
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4 bg-white border border-gray-200 rounded-lg">
                        No MCQ results available
                    </p>
                )}
            </div>
        </details>
    )}
    
    {/* Short Answer Results - Only show if evaluationDetails exists */}
    {result.evaluationResults.evaluationDetails && (
        <details open>
            <summary className="cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-100">
                Short Answer Questions {result.evaluationResults.evaluationDetails?.shortQuestionResults ? `(${result.evaluationResults.evaluationDetails.shortQuestionResults.length})` : '(0)'}
            </summary>
            <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
                {console.log('Rendering Short Answer Results:', result.evaluationResults.evaluationDetails?.shortQuestionResults)}
                {result.evaluationResults.evaluationDetails?.shortQuestionResults?.length > 0 ? (
                    result.evaluationResults.evaluationDetails.shortQuestionResults.map((q) => (
                        <div key={q.questionNumber} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="mb-2">
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                    Question {q.questionNumber}
                                </span>
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                                    Score: {q.score || 0}
                                </span>
                            </div>
                            
                            <div className="mt-3">
                                <div className="text-sm font-medium text-gray-700">Your Answer:</div>
                                <p className="mt-1 text-sm text-gray-600 p-3 bg-white rounded border border-gray-200">
                                    {q.studentAnswer || <em className="text-gray-400">No answer provided</em>}
                                </p>
                            </div>
                            
                            <div className="mt-3">
                                <div className="text-sm font-medium text-gray-700">Model Answer:</div>
                                <p className="mt-1 text-sm text-gray-600 p-3 bg-white rounded border border-gray-200">
                                    {q.modelAnswer || <em className="text-gray-400">No model answer provided</em>}
                                </p>
                            </div>
                            
                            {q.feedback && (
                                <div className="mt-3">
                                    <div className="text-sm font-medium text-gray-700">Feedback:</div>
                                    <p className="mt-1 text-sm text-gray-600 p-3 bg-yellow-50 rounded border border-yellow-100">
                                        {q.feedback}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4 bg-white border border-gray-200 rounded-lg">
                        No short answer results available
                    </p>
                )}
            </div>
        </details>
    )}
</div>