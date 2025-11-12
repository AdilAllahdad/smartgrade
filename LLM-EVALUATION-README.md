# AI-Powered Exam Evaluation System

This system integrates a FastAPI-based LLM model for automatic evaluation of student exam submissions.

## How to Use

### 1. Start the LLM Evaluation Service

1. Run the Python notebook with the LLM evaluation code.
2. Note the ngrok URL that is displayed (like `https://xxxx-xx-xx-xxx-xx.ngrok-free.app`).

### 2. Configure the Web Application

1. In the Evaluation interface, click the gear icon to open the configuration modal.
2. Enter the ngrok URL from step 1.
3. Click Save to store the URL.

### 3. Evaluate Student Submissions

1. Select a student submission to evaluate.
2. Click "Run AI Evaluation" to process the submission.
3. The system will:
   - Extract MCQs and short answers from both the student submission and answer sheet
   - Send the data to the LLM API for processing
   - Display detailed evaluation results including scores and feedback

### 4. Review and Confirm Evaluation

1. Review the AI-generated evaluation.
2. Scores are calculated for:
   - MCQs (exact matching)
   - Short answers (semantic similarity, keyword matching, and completeness)
3. The teacher can adjust scores if needed before final submission.

## LLM Model Features

- **MCQ Evaluation**: Exact matching against correct answers
- **Short Answer Evaluation**: 
  - Semantic similarity using sentence transformers
  - Length comparison with expected answers
  - Keyword matching for key concepts
  - Completeness assessment based on structure and formatting
- **Feedback Generation**: Constructive feedback using the Flan-T5 model

## Troubleshooting

- If the evaluation fails, check that your ngrok URL is correct and the service is running
- The ngrok URL changes each time you restart your Python notebook, so you'll need to update it
- Make sure your documents are properly formatted for processing
