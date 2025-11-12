const express = require('express');
const router = express.Router();
const { evaluateSubmission, saveEvaluationResults } = require('../controllers/evaluationController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

// Routes
// For development, we're bypassing authentication
// In production, uncomment the middleware: protect, teacherOnly
router.post('/', evaluateSubmission);

// Route to save evaluation results
// This should be protected in production
router.post('/save', protect, teacherOnly, saveEvaluationResults);

module.exports = router;
