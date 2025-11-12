const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const Teacher = require('../models/teacherModel');
const Student = require('../models/studentModel');
const Guardian = require('../models/guardianModel');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Log token info for debugging (masked)
            console.log('Processing auth token:', token.substring(0, 10) + '...');
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded successfully, payload:', {
                id: decoded.id,
                role: decoded.role,
                semester: decoded.semester,
                section: decoded.section,
                studentId: decoded.studentId
            });
            
            // Select the appropriate model based on role
            let Model;
            switch (decoded.role) {
                case 'admin':
                    Model = Admin;
                    break;
                case 'teacher':
                    Model = Teacher;
                    break;
                case 'student':
                    Model = Student;
                    break;
                case 'guardian':
                    Model = Guardian;
                    break;
                default:
                    throw new Error(`Invalid role: ${decoded.role}`);
            }

            req.user = await Model.findById(decoded.id).select('-password');
            
            if (!req.user) {
                throw new Error(`User not found with ID: ${decoded.id} for role: ${decoded.role}`);
            }
            
            console.log(`User authenticated: ${req.user._id} (${decoded.role})`);
            
            req.user.role = decoded.role; // Ensure role is available
            
            // Attach semester and section for students if present in token
            if (decoded.role === 'student') {
                req.user.semester = decoded.semester || req.user.semester;
                req.user.section = decoded.section || req.user.section;
            }
            
            // Attach student ID for guardians
            if (decoded.role === 'guardian' && decoded.studentId) {
                req.user.studentId = decoded.studentId;
                console.log(`Guardian accessing student data: ${decoded.studentId}`);
            }
            
            next();
        } catch (error) {
            console.error('Authentication error details:', {
                message: error.message,
                type: error.name,
                stack: error.stack,
                token: token ? `${token.substring(0, 5)}...` : 'No token',
                headers: req.headers.authorization ? `${req.headers.authorization.substring(0, 15)}...` : 'No auth header',
                path: req.originalUrl,
                method: req.method
            });
            return res.status(401).json({ 
                message: 'Not authorized, token failed', 
                details: error.message 
            });
        }
    }

    if (!token) {
        return res.status(401).json({ 
            message: 'Not authorized, no token',
            details: {
                headers: Object.keys(req.headers),
                authHeader: req.headers.authorization ? 'Present but invalid format' : 'Missing'
            }
        });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const teacher = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as a teacher' });
    }
};

const student = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as a student' });
    }
};

const teacherOnly = (req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized. Teachers only.' });
    }
};

module.exports = { protect, admin, teacher, student, teacherOnly };
