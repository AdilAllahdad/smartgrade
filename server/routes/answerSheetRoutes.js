const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAnswerSheets, downloadAnswerSheet } = require('../controllers/answerSheetController');

// Get all answer sheets (filtered by user role)
router.get('/', protect, getAnswerSheets);

// Download an answer sheet by ID
router.get('/download/:id', protect, downloadAnswerSheet);

module.exports = router;
