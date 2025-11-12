const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const { submitExam, getStudentSubmissions, downloadSubmission, getSubmissionsByExam, getSubmissionByExamAndStudent, updateSubmissionScore, addSubmissionNotes, getStudentResult } = require('../controllers/studentSubmissionController');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

// Configure GridFS storage
const storage = new GridFsStorage({
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/exam-system',
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});

const upload = multer({ storage });

// Submit a completed exam
router.post('/submit-exam', protect, upload.single('completedExam'), submitExam);

// Get student's submitted exams
router.get('/submissions', protect, getStudentSubmissions);

// Download a submitted exam
router.get('/submissions/download/:id', protect, downloadSubmission);

// Get all submissions for a specific exam
router.get('/exam/:examId', protect, getSubmissionsByExam);

// Get a specific student's submission for a specific exam
router.get('/exam/:examId/student/:studentId', protect, getSubmissionByExamAndStudent);

// Update submission score
router.post('/:submissionId/score', protect, updateSubmissionScore);

// Serve files from GridFS
router.get('/file/:filename', async (req, res) => {
    try {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });

        const file = await mongoose.connection.db.collection('uploads.files').findOne({
            filename: req.params.filename
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);

        const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({ message: 'Error serving file' });
    }
});

// Add notes to a submission
router.post('/:submissionId/notes', protect, addSubmissionNotes);

// Get student's result for a specific exam
router.get('/result/:examId', protect, getStudentResult);

module.exports = router;
