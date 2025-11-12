const express = require('express');
const router = express.Router();
const { 
    getResultById, 
    getResultsByStudent, 
    getResultByExamAndStudent
} = require('../controllers/resultController');
const { protect } = require('../middleware/authMiddleware');

// All routes should be protected
router.get('/:id', protect, getResultById);
router.get('/student/:studentId', protect, getResultsByStudent);
router.get('/exam/:examId/student/:studentId', protect, getResultByExamAndStudent);

module.exports = router;
