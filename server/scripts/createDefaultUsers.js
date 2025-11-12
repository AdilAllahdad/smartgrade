const mongoose = require('mongoose');
const Teacher = require('../models/teacherModel');
const Student = require('../models/studentModel');

// MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/exam-system';

const createDefaultUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create default teacher if not exists
        const teacherExists = await Teacher.findOne({ email: 'teacher@example.com' });
        if (!teacherExists) {
            const teacher = await Teacher.create({                name: 'Default Teacher',
                email: 'teacher@example.com',
                password: 'teacher123',
                department: 'Computer Science',
                designation: 'Assistant Professor'
            });
            console.log('Default teacher created successfully:', teacher.email);
        } else {
            console.log('Teacher account already exists');
        }

        // Create first default student if not exists
        const studentExists = await Student.findOne({ email: 'student@example.com' });
        if (!studentExists) {
            const student = await Student.create({                name: 'Default Student',
                email: 'student@example.com',
                password: 'student123',
                batchNumber: '2025',
                department: 'Computer Science',
                rollNumber: 'CS2025001',
                semester: 1
            });
            console.log('Default student created successfully:', student.email);
        } else {
            console.log('Student account already exists');
        }

        // Create second default student with SP22-BSE-006 if not exists
        const student2Exists = await Student.findOne({ rollNumber: 'SP22-BSE-006' });
        if (!student2Exists) {
            const student2 = await Student.create({                name: 'BSE Student',
                email: 'sp22.bse.006@example.com',
                password: '123',
                batchNumber: '2022',
                department: 'Software Engineering',
                rollNumber: 'SP22-BSE-006',
                semester: 6
            });
            console.log('BSE student created successfully:', student2.rollNumber);
        } else {
            console.log('BSE student account already exists');
        }

        console.log('\nDefault credentials:');
        console.log('Teacher - Email: teacher@example.com, Password: teacher123');
        console.log('Student - Email: student@example.com, Password: student123');
        console.log('BSE Student - Roll Number: SP22-BSE-006, Password: 123');

    } catch (error) {
        console.error('Error creating default users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

createDefaultUsers();
