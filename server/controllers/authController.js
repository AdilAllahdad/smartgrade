const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const Teacher = require('../models/teacherModel');
const Student = require('../models/studentModel');
const Guardian = require('../models/guardianModel');

// Generate JWT Token
const generateToken = (id, role, semester, section, studentId) => {
    // Only include semester and section for students
    const payload = { id, role };
    if (role === 'student' && semester && section) {
        payload.semester = semester;
        payload.section = section;
    }
    // Include student ID for guardians
    if (role === 'guardian' && studentId) {
        payload.studentId = studentId;
    }
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { role } = req.body;
        let user;
        let Model;

        // Check which model to use based on role
        switch (role) {
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
                return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Check if user already exists
        const userExists = await Model.findOne({ email: req.body.email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // For students, ensure semester and section are present
        if (role === 'student') {
            if (!req.body.semester || !req.body.section) {
                return res.status(400).json({ message: 'Semester and section are required for students' });
            }
        }
        // Handle guardian creation for students
        if (role === 'student' && req.body.guardian) {
            try {
                // Create a clean student object without the guardian nested object
                const studentData = { ...req.body };
                
                // Extract guardian info before removing it from studentData
                const guardianInfo = { ...studentData.guardian };
                delete studentData.guardian; // Remove the guardian object from studentData
                
                // Create the student first
                user = await Model.create(studentData);
                
                if (user) {
                    // Now create the guardian with reference to the student
                    const guardianData = {
                        name: guardianInfo.name,
                        email: guardianInfo.email,
                        phoneNumber: guardianInfo.phoneNumber || guardianInfo.phone, // Support both field names
                        password: req.body.password, // Use the same password as student
                        role: 'guardian',
                        student: user._id // Now we can reference the student
                    };
                    
                    const guardian = await Guardian.create(guardianData);
                    
                    // Update student with reference to guardian
                    user.guardian = guardian._id;
                    await user.save();
                    
                    // Generate token for student
                    const token = generateToken(user._id, role, user.semester, user.section);
                    
                    res.status(201).json({
                        _id: user._id,
                        ...studentData,
                        password: undefined,
                        guardianId: guardian._id,
                        token
                    });
                }
            } catch (error) {
                // If anything fails, clean up and return error
                console.error('Error creating student with guardian:', error);
                
                // If student was created but guardian creation failed, delete the student
                if (user && user._id) {
                    await Model.findByIdAndDelete(user._id);
                }
                
                throw new Error('Failed to create student account: ' + error.message);
            }
        } else {
            // Create user based on role (for non-student roles)
            user = await Model.create(req.body);
            
            if (user) {
                let token;
                if (role === 'student') {
                    token = generateToken(user._id, role, user.semester, user.section);
                } else if (role === 'guardian' && req.body.student) {
                    token = generateToken(user._id, role, null, null, req.body.student);
                } else {
                    token = generateToken(user._id, role);
                }
                
                res.status(201).json({
                    _id: user._id,
                    ...req.body,
                    password: undefined,
                    token
                });
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        console.log('Login attempt:', { ...req.body, password: '[REDACTED]' });
        const { email, rollNumber, password, role } = req.body;

        // Validate input
        if ((!email && !rollNumber) || !password || !role) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide all required fields',
                details: {
                    authentication: !email && !rollNumber ? 'Either email or roll number is required' : null,
                    password: !password ? 'Password is required' : null,
                    role: !role ? 'Role is required' : null
                }
            });
        }

        let Model;
        // Determine which model to use based on role
        switch (role.toLowerCase()) {
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
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid role specified',
                    details: { role: `Role must be one of: admin, teacher, student, guardian. Received: ${role}` }
                });
        }

        // Find user based on email or roll number
        const user = await Model.findOne(
            role === 'student' && rollNumber 
                ? { rollNumber } 
                : { email }
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token and send response
        let token;
        if (role === 'student') {
            token = generateToken(user._id, role, user.semester, user.section);
        } else if (role === 'guardian') {
            // For guardian, include student ID in the token
            console.log('Guardian login successful:', {
                guardianId: user._id,
                guardianEmail: user.email,
                studentId: user.student,
                studentIdType: typeof user.student
            });
            token = generateToken(user._id, role, null, null, user.student);
        } else {
            token = generateToken(user._id, role);
        }
        
        // Prepare response based on role
        let responseData = {
            id: user._id,
            name: user.name,
            role: role.toLowerCase(),
            email: user.email,
            token
        };
        
        // Add role-specific fields
        if (role === 'student') {
            responseData = {
                ...responseData,
                rollNumber: user.rollNumber,
                semester: user.semester,
                section: user.section,
                email: user.email
            };
        } else if (role === 'guardian') {
            console.log('Guardian login - Student ID:', user.student);
            responseData = {
                ...responseData,
                studentId: user.student
            };
        }
        
        res.json({
            success: true,
            user: responseData
        });
    } catch (error) {
        console.error('Login error:', error);
        console.error('Login attempt details:', { 
            email: req.body.email || 'Not provided', 
            rollNumber: req.body.rollNumber || 'Not provided',
            role: req.body.role,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        // Log stack trace for better debugging
        console.error('Stack trace:', error.stack);
        
        // Send detailed error response
        res.status(500).json({ 
            success: false,
            message: 'Server error during login',
            details: { 
                server: error.message,
                type: error.name,
                path: error.path || 'Unknown',
                code: error.code || 'Unknown'
            }
        });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        let Model;
        switch (req.user.role) {
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
                return res.status(400).json({ message: 'Invalid role specified' });
        }

        const user = await Model.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                ...user._doc,
                password: undefined
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an admin user
// @route   POST /api/auth/create-admin
// @access  Public
const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create admin
        const admin = await Admin.create({
            name,
            email,
            password
        });

        if (admin) {
            res.status(201).json({
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                token: generateToken(admin._id, 'admin')
            });
        } else {
            res.status(400).json({ message: 'Invalid admin data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        // Get users from all collections
        const teachers = await Teacher.find().select('-password');
        const students = await Student.find().select('-password');

        // Combine all users into a single array
        // Make sure to include the createdAt timestamp for sorting on the client
        const users = [
            ...teachers.map(t => ({ ...t.toObject(), role: 'teacher' })),
            ...students.map(s => ({ ...s.toObject(), role: 'student' }))
        ];
        
        // Sort by createdAt date (newest first) - now we're sorting on the server too
        users.sort((a, b) => {
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Try to find and delete from teachers
        let deleted = await Teacher.findByIdAndDelete(userId);
        
        // If not found in teachers, try students
        if (!deleted) {
            deleted = await Student.findByIdAndDelete(userId);
        }

        if (!deleted) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
};

module.exports = {
    createAdmin,
    loginUser,
    getUserProfile,
    getUsers,
    registerUser,
    deleteUser
};
