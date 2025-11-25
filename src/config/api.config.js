/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Get the API base URL from environment variables
// In Vite, env variables must be prefixed with VITE_
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Full API URL with /api prefix
export const API_URL = `${API_BASE_URL}/api`;

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// API endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    CREATE_ADMIN: '/auth/create-admin',
    USERS: '/auth/users',
  },
  
  // Exam Papers endpoints
  EXAM_PAPERS: {
    BASE: '/exam-papers',
    UPLOAD: '/exam-papers/upload',
    BY_ID: (id) => `/exam-papers/${id}`,
    DOWNLOAD: (id) => `/exam-papers/download/${id}`,
  },
  
  // Answer Sheets endpoints
  ANSWER_SHEETS: {
    BASE: '/answer-sheets',
    BY_EXAM: (examId) => `/answer-sheets/exam/${examId}`,
    DOWNLOAD: (id) => `/answer-sheets/download/${id}`,
  },
  
  // Student Submissions endpoints
  STUDENT_SUBMISSIONS: {
    BASE: '/student-submissions',
    SUBMIT: '/student-submissions/submit-exam',
    BY_EXAM: (examId) => `/student-submissions/exam/${examId}`,
    BY_STUDENT: (examId, studentId) => `/student-submissions/exam/${examId}/student/${studentId}`,
    FILE: (filename) => `/student-submissions/file/${filename}`,
    NOTES: (id) => `/student-submissions/${id}/notes`,
    SCORE: (id) => `/student-submissions/${id}/score`,
    SUBMISSIONS: '/student-submissions/submissions',
  },
  
  // Students endpoints
  STUDENTS: {
    BASE: '/students',
    BY_ID: (id) => `/students/${id}`,
  },
  
  // Results endpoints
  RESULTS: {
    BASE: '/results',
    BY_STUDENT: (studentId) => `/results/student/${studentId}`,
    BY_ID: (resultId) => `/results/${resultId}`,
  },
  
  // Evaluation endpoints
  EVALUATION: {
    BASE: '/evaluation',
    EVALUATE: '/evaluation/evaluate',
  },
};

/**
 * Get full URL for a given path
 * @param {string} path - API endpoint path
 * @returns {string} Full URL
 */
export const getFullUrl = (path) => {
  // If path already starts with http/https, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If path doesn't start with /, add it
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Return full URL
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Get API URL for a given endpoint path
 * @param {string} path - API endpoint path (without /api prefix)
 * @returns {string} Full API URL
 */
export const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

export default {
  API_BASE_URL,
  API_URL,
  API_ENDPOINTS,
  getFullUrl,
  getApiUrl,
  isDevelopment,
  isProduction,
};
