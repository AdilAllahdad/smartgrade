const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const examPaperRoutes = require('./routes/examPaperRoutes');
const answerSheetRoutes = require('./routes/answerSheetRoutes');
const studentSubmissionRoutes = require('./routes/studentSubmissionRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const resultRoutes = require('./routes/resultRoutes');
const studentRoutes = require('./routes/studentRoutes');
const errorHandler = require('./middleware/errorMiddleware');

dotenv.config();

const PORT = 5000; // Fixed port number

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: '*', // Allow all origins during development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Support both JSON and form data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware
app.use((req, res, next) => {
    console.log('=================================');
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
    console.log('=================================');
    next();
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Auth routes
app.use('/api/auth', authRoutes);
// Exam paper routes
app.use('/api/exam-papers', examPaperRoutes);
// Answer sheet routes
app.use('/api/answer-sheets', answerSheetRoutes);
// Student submission routes
app.use('/api/student-submissions', studentSubmissionRoutes);
// Evaluation routes
app.use('/api/evaluate', evaluationRoutes);
// Result routes
app.use('/api/results', resultRoutes);
// Student routes
app.use('/api/students', studentRoutes);

// Error Handling Middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    console.log('404 Route Not Found:', {
        method: req.method,
        url: req.url,
        path: req.path,
        baseUrl: req.baseUrl
    });
    res.status(404).json({ message: 'Route not found' });
});

// Start the server with error handling
const server = app.listen(PORT, () => {
    console.log('=================================');
    console.log(`Server is running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
    console.log('=================================');
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error occurred:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please close the other application or use a different port.`);
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(error.name, error.message);
    console.error(error.stack);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(error.name, error.message);
    console.error(error.stack);
    server.close(() => {
        process.exit(1);
    });
});
