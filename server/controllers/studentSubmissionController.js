const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const ExamPaper = require('../models/examPaperModel');
const User = require('../models/userModel');

// GridFS setup for file storage
let gfs;
mongoose.connection.once('open', () => {
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
});

// Create a model for student submissions if it doesn't exist
let StudentSubmission;
try {
    StudentSubmission = mongoose.model('StudentSubmission');
} catch (error) {
    const studentSubmissionSchema = new mongoose.Schema({
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        examPaper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ExamPaper',
            required: true
        },
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        filename: {
            type: String,
            required: true
        },
        submissionDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'graded'],
            default: 'pending'
        },
        score: {
            type: Number
        },
        notes: [{
            text: String,
            position: {
                x: Number,
                y: Number
            },
            documentType: String,
            createdAt: Date,
            id: String
        }],
        feedback: {
            type: String
        },
        status: {
            type: String,
            enum: ['pending', 'evaluated', 'graded'],
            default: 'pending'
        },
        evaluatedAt: {
            type: Date
        },
        resultId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Result'
        }
    });

    StudentSubmission = mongoose.model('StudentSubmission', studentSubmissionSchema);
}

// Submit a completed exam
const submitExam = async (req, res) => {
    try {
        // Check if the file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Check if exam paper exists
        const examId = req.body.examId || req.body.examPaperId; // Accept either parameter name
        if (!examId) {
            return res.status(400).json({ message: 'Exam paper ID is required' });
        }

        const examPaper = await ExamPaper.findById(examId);
        if (!examPaper) {
            return res.status(404).json({ message: 'Exam paper not found' });
        }

        // Check if student has already submitted this exam
        const existingSubmission = await StudentSubmission.findOne({
            student: req.user._id,
            examPaper: examId
        });

        if (existingSubmission) {
            return res.status(400).json({ 
                message: 'You have already submitted this exam',
                submissionDate: existingSubmission.submissionDate,
                submissionId: existingSubmission._id
            });
        }

        // Create student submission record
        const submission = new StudentSubmission({
            student: req.user._id,
            examPaper: examId,
            fileId: req.file.id,
            filename: req.file.filename
        });

        await submission.save();

        res.status(201).json({
            message: 'Exam submitted successfully',
            submission: {
                _id: submission._id,
                filename: submission.filename,
                submissionDate: submission.submissionDate,
                status: submission.status
            }
        });
    } catch (error) {
        console.error('Error submitting exam:', error);
        res.status(500).json({ message: 'Error submitting exam', error: error.message });
    }
};

// Get student's submitted exams
const getStudentSubmissions = async (req, res) => {
    try {
        // Get all submissions for the logged-in student
        const submissions = await StudentSubmission.find({ student: req.user._id })
            .populate('examPaper', 'title semester section _id')
            .sort({ submissionDate: -1 });

        const submissionsWithUrls = submissions.map(submission => ({
            ...submission._doc,
            downloadUrl: `/api/student-submissions/submissions/download/${submission._id}`
        }));

        res.status(200).json(submissionsWithUrls);
    } catch (error) {
        console.error('Error fetching student submissions:', error);
        res.status(500).json({ message: 'Error fetching submissions', error: error.message });
    }
};

// Download a submitted exam
const downloadSubmission = async (req, res) => {
    try {
        const submission = await StudentSubmission.findById(req.params.id);
        
        // Check if submission exists and belongs to the requesting student
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        
        // Only allow the student who submitted it or a teacher to download
        if (req.user.role !== 'teacher' && !submission.student.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to access this submission' });
        }

        const downloadStream = gfs.openDownloadStream(mongoose.Types.ObjectId(submission.fileId));
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=${submission.filename}`);
        
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error downloading submission:', error);
        res.status(500).json({ message: 'Error downloading submission', error: error.message });
    }
};

// @desc    Get all submissions for a specific exam
// @route   GET /api/student-submissions/exam/:examId
// @access  Private (Teacher)
const getSubmissionsByExam = async (req, res) => {
    try {
        const { examId } = req.params;
        
        console.log('Fetching submissions for exam ID:', examId);
        
        // Only teachers can access this endpoint
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to access this resource' });
        }
        
        const submissions = await StudentSubmission.find({ examPaper: examId })
            .populate('student', 'name email rollNumber semester section')
            .sort({ submissionDate: -1 });
        
        console.log('Found submissions:', submissions.length);
        
        // Add download URLs and file URLs to each submission
        const submissionsWithUrls = submissions.map(submission => {
            return {
                ...submission.toObject(),
                downloadUrl: `/api/student-submissions/submissions/download/${submission._id}`,
                fileUrl: `/api/student-submissions/submissions/download/${submission._id}`,
            };
        });
        
        console.log('Returning submissions with URLs:', submissionsWithUrls.length);
        res.status(200).json(submissionsWithUrls);
    } catch (error) {
        console.error('Error getting submissions by exam:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get a specific student's submission for a specific exam
// @route   GET /api/student-submissions/exam/:examId/student/:studentId
// @access  Private (Teacher/Student)
const getSubmissionByExamAndStudent = async (req, res) => {
    try {
        const { examId, studentId } = req.params;
        
        // Students can only access their own submissions
        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({ message: 'Not authorized to access this submission' });
        }
        
        const submission = await StudentSubmission.findOne({
            examPaper: examId,
            student: studentId
        }).populate('student', 'name email semester section');
        
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        
        // Add download URL and file URL to the submission
        const submissionWithUrls = {
            ...submission.toObject(),
            downloadUrl: `/api/student-submissions/submissions/download/${submission._id}`,
            fileUrl: `/api/student-submissions/submissions/download/${submission._id}`,
        };
        
        res.status(200).json(submissionWithUrls);
    } catch (error) {
        console.error('Error getting submission by exam and student:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update submission score
// @route   POST /api/student-submissions/:submissionId/score
// @access  Private (Teacher)
const updateSubmissionScore = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { score } = req.body;
        
        // Only teachers can update scores
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update scores' });
        }
        
        if (score === undefined || score < 0 || score > 100) {
            return res.status(400).json({ message: 'Invalid score. Score must be between 0 and 100.' });
        }
        
        const submission = await StudentSubmission.findById(submissionId);
        
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        
        submission.score = score;
        submission.status = 'graded';
        await submission.save();
        
        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        console.error('Error updating submission score:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Add notes to a submission
// @route   POST /api/student-submissions/:submissionId/notes
// @access  Private (Teacher)
const addSubmissionNotes = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { notes } = req.body;
        
        // Only teachers can add notes
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to add notes' });
        }
        
        if (!notes || !Array.isArray(notes)) {
            return res.status(400).json({ message: 'Invalid notes format' });
        }
        
        const submission = await StudentSubmission.findById(submissionId);
        
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        
        submission.notes = notes;
        await submission.save();
        
        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        console.error('Error adding submission notes:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get a student's result for a specific exam
const getStudentResult = async (req, res) => {
    try {
        const { examId } = req.params;
        
        // Verify the exam exists
        const examPaper = await ExamPaper.findById(examId);
        if (!examPaper) {
            return res.status(404).json({ message: 'Exam paper not found' });
        }

        // Find the submission for this student and exam
        const submission = await StudentSubmission.findOne({
            student: req.user._id,
            examPaper: examId
        });

        if (!submission) {
            return res.status(404).json({ message: 'No submission found for this exam' });
        }

        console.log('Returning student result with status:', submission.status);
        
        // Return the result with necessary information
        return res.status(200).json({
            _id: submission._id,
            examPaperId: examId,
            examTitle: examPaper.title,
            submissionDate: submission.submissionDate,
            status: submission.status, // This field is critical for the frontend to check
            // Only include score if submission has been evaluated or graded
            score: submission.status === 'evaluated' || submission.status === 'graded' ? submission.score : undefined,
            totalMarks: examPaper.totalMarks || 100, // Default to 100 if not specified
            feedback: submission.status === 'evaluated' || submission.status === 'graded' ? submission.feedback : undefined,
            submissionUrl: `/api/student-submissions/submissions/download/${submission.fileId}`,
            filename: submission.filename,
            // Only include resultId if submission has been evaluated or graded
            resultId: submission.status === 'evaluated' || submission.status === 'graded' ? submission.resultId : undefined
        });

    } catch (error) {
        console.error('Error fetching student result:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    submitExam,
    getStudentSubmissions,
    downloadSubmission,
    getSubmissionsByExam,
    getSubmissionByExamAndStudent,
    updateSubmissionScore,
    addSubmissionNotes,
    getStudentResult
};
