const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Student = require('../models/studentModel');

const router = express.Router();

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private (Only accessible by the student, their guardian, teachers, or admin)
router.get('/:id', protect, async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Check authorization - only the student, their guardian, teachers or admins can access
        const isStudent = req.user._id.toString() === studentId;
        const isGuardian = req.user.role === 'guardian' && req.user.studentId === studentId;
        const isTeacher = req.user.role === 'teacher';
        const isAdmin = req.user.role === 'admin';
        
        if (!isStudent && !isGuardian && !isTeacher && !isAdmin) {
            return res.status(401).json({ message: 'Not authorized to access this student information' });
        }
        
        // Find student by ID
        const student = await Student.findById(studentId).select('-password');
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;