const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/adminModel');

// MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/exam-system';

const createDefaultAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const adminExists = await Admin.findOne({ email: 'admin@example.com' });
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const admin = await Admin.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123' // This will be hashed by the pre-save hook
        });

        console.log('Admin user created successfully:', admin.email);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
    }
};

createDefaultAdmin();
