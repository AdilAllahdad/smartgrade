const express = require('express');
const router = express.Router();
const { uploadExamPaper, getExamPapers, downloadExamPaper } = require('../controllers/examPaperController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Route for uploading exam papers (teachers only)
// Accept both exam paper and answer sheet in one request
router.post('/upload', protect, teacherOnly, upload.fields([
	{ name: 'examPaper', maxCount: 1 },
	{ name: 'answerSheet', maxCount: 1 }
]), uploadExamPaper);

// Route for getting all exam papers (accessible to both teachers and students)
router.get('/', protect, getExamPapers);

// Route for getting a single exam paper by ID
const { getExamPaperById } = require('../controllers/examPaperController');
router.get('/:id', protect, getExamPaperById);

// Route for downloading exam papers
router.get('/download/:id', protect, downloadExamPaper);

module.exports = router;
