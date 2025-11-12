const asyncHandler = require('express-async-handler');
const Result = require('../models/resultModel');

// @desc    Get result by ID
// @route   GET /api/results/:id
// @access  Private
const getResultById = asyncHandler(async (req, res) => {
    const result = await Result.findById(req.params.id);
    
    if (!result) {
        res.status(404);
        throw new Error('Result not found');
    }
    
    // Check if the user is the student who owns this result, a guardian of the student, or a teacher/admin
    const isOwner = result.student.toString() === req.user._id.toString();
    const isTeacher = req.user.role === 'teacher';
    const isAdmin = req.user.role === 'admin';
    const isGuardian = req.user.role === 'guardian' && req.user.studentId && req.user.studentId === result.student.toString();
    
    if (!isOwner && !isTeacher && !isAdmin && !isGuardian) {
        res.status(401);
        throw new Error('Not authorized to access this result');
    }
    
    res.status(200).json(result);
});

// @desc    Get results for a student
// @route   GET /api/results/student/:studentId
// @access  Private (Student, Teacher, Admin)
const getResultsByStudent = asyncHandler(async (req, res) => {
    const studentId = req.params.studentId;
    
    // Check if the user is requesting their own results, is a guardian of the student, or is a teacher/admin
    const isOwner = studentId === req.user._id.toString();
    const isTeacher = req.user.role === 'teacher';
    const isAdmin = req.user.role === 'admin';
    const isGuardian = req.user.role === 'guardian' && req.user.studentId && req.user.studentId === studentId;
    
    if (!isOwner && !isTeacher && !isAdmin && !isGuardian) {
        res.status(401);
        throw new Error('Not authorized to access these results');
    }
    
    const results = await Result.find({ student: studentId })
        .populate('exam', 'title description')
        .sort({ createdAt: -1 });
    
    res.status(200).json(results);
});

// @desc    Get result for a specific exam and student
// @route   GET /api/results/exam/:examId/student/:studentId
// @access  Private (Student, Teacher, Admin)
const getResultByExamAndStudent = asyncHandler(async (req, res) => {
    const { examId, studentId } = req.params;
    
    // Check if the user is requesting their own result or is a teacher/admin
    const isOwner = studentId === req.user._id.toString();
    const isTeacher = req.user.role === 'teacher';
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isTeacher && !isAdmin) {
        res.status(401);
        throw new Error('Not authorized to access this result');
    }
    
    const result = await Result.findOne({ 
        exam: examId,
        student: studentId
    }).populate('exam', 'title description');
    
    if (!result) {
        res.status(404);
        throw new Error('Result not found');
    }
    
    res.status(200).json(result);
});

module.exports = {
    getResultById,
    getResultsByStudent,
    getResultByExamAndStudent
};
