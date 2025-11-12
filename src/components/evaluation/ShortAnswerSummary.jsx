import React from 'react';

const ShortAnswerSummary = ({ questions, title, bgColor = "bg-green-50" }) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className={`mt-4 ${bgColor} p-2 rounded`}>
      <h5 className="font-semibold">{title}:</h5>
      <ul className="list-disc pl-5 mt-2">
        {questions.map((q, index) => (
          <li key={index}>
            Q{q.questionNumber}: {q.question ? `${q.question.substring(0, 30)}...` : ""}
            {q.marks && <span className="ml-2 text-blue-600 font-medium">[{q.marks} marks]</span>}
            <br />
            <span className="text-gray-600">
              {title.includes("Key") ? "Model Answer: " : "Answer: "}
              {q.answer ? `${q.answer.substring(0, 50)}...` : "None provided"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShortAnswerSummary;
