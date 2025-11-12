import React from 'react';

const McqSummary = ({ mcqs, title, bgColor = "bg-blue-50" }) => {
  if (!mcqs || mcqs.length === 0) return null;

  return (
    <div className={`mt-4 ${bgColor} p-2 rounded`}>
      <h5 className="font-semibold">{title}:</h5>
      <ul className="list-disc pl-5 mt-2">
        {mcqs.map((mcq, index) => (
          <li key={index}>
            Q{mcq.questionNumber}: {mcq.correctAnswer ? 
              `Correct answer is ${mcq.correctAnswer} ${mcq.answerText ? `(${mcq.answerText})` : ""}` : 
              `Selected answer: ${mcq.selectedAnswer || "None"}`}
            {mcq.marks && <span className="ml-2 text-blue-600 font-medium">[{mcq.marks} marks]</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default McqSummary;
