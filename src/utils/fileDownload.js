/**
 * Utility for handling file downloads in the application
 */

// Import the files as URL assets instead of direct imports
// The files will be processed by Vite's asset handling system
const questionPaperFormat = new URL('../assets/question_paper_formate.docx', import.meta.url).href;
const specialAnswerSheetFormat = new URL('../assets/special_answer_sheet_formate.docx', import.meta.url).href;

/**
 * Downloads a file with the specified name
 * @param {string} url - URL of the file to download
 * @param {string} fileName - Name to save the file as
 */
export const downloadFile = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Available template files for download
 */
export const TEMPLATES = {
  QUESTION_PAPER: {
    url: questionPaperFormat,
    fileName: 'question_paper_format.docx',
  },
  SPECIAL_ANSWER_SHEET: {
    url: specialAnswerSheetFormat,
    fileName: 'special_answer_sheet_format.docx',
  },
};