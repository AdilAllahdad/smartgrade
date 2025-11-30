const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('Setting up GridFS storage with existing mongoose connection');

// Create storage engine using the existing mongoose connection
const storage = new GridFsStorage({
    db: mongoose.connection,
    file: (req, file) => {
        console.log('Processing file for upload:', file.originalname);
        const filename = `${Date.now()}-${file.originalname}`;
        console.log('Generated filename:', filename);
        
        return {
            bucketName: 'uploads',
            filename: filename
        };
    }
});

// Add error handler for storage engine
storage.on('connection', (db) => {
    console.log('GridFS storage using existing mongoose connection');
});

storage.on('connectionFailed', (err) => {
    console.error('GridFS storage connection failed:', err);
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['.doc', '.docx', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
    }
};

// Initialize upload
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

module.exports = upload;
