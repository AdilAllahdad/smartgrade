const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const path = require('path');
require('dotenv').config();

console.log('Setting up GridFS storage with MongoDB URL');

// Create storage engine with error handling
const storage = new GridFsStorage({
    url: process.env.MONGODB_URI,
    options: { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000, // Increase timeouts
        connectTimeoutMS: 15000
    },
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
storage.on('connection', () => {
    console.log('GridFS storage connected successfully');
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
