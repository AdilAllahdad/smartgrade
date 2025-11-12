// Get a single exam paper by ID
const getExamPaperById = async (req, res) => {
    try {
        // First find the exam paper
        const examPaper = await ExamPaper.findById(req.params.id).populate('uploadedBy', 'name');
        if (!examPaper) {
            return res.status(404).json({ message: 'Exam paper not found' });
        }

        // Find the associated answer sheets
        const AnswerSheet = require('../models/answerSheetModel');
        const answerSheets = await AnswerSheet.find({ examPaper: examPaper._id });

        // Add download URLs and answer sheets to the response
        const response = {
            ...examPaper._doc,
            downloadUrl: `/api/exam-papers/download/${examPaper._id}`,
            answerSheets: answerSheets.map(sheet => ({
                ...sheet._doc,
                downloadUrl: `/api/answer-sheets/download/${sheet._id}`
            }))
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam paper', error: error.message });
    }
};

const mongoose = require('mongoose');
const ExamPaper = require('../models/examPaperModel');

let gfs;
mongoose.connection.once('open', () => {
    try {
        console.log('MongoDB connection opened, initializing GridFS');
        gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });
        console.log('GridFS initialized successfully');
    } catch (error) {
        console.error('Error initializing GridFS:', error);
    }
});

const uploadExamPaper = async (req, res) => {
    try {
        // Both files must be present
        if (!req.files || !req.files.examPaper || !req.files.answerSheet) {
            return res.status(400).json({ message: 'Both exam paper and answer sheet files are required.' });
        }

        // Validate semester and section
        if (!req.body.semester || !req.body.section) {
            return res.status(400).json({ message: 'Semester and section are required' });
        }

        // Save exam paper
        const examPaperFile = req.files.examPaper[0];
        const examPaper = new ExamPaper({
            title: req.body.title,
            fileId: examPaperFile.id,
            filename: examPaperFile.filename,
            uploadedBy: req.user._id,
            semester: req.body.semester,
            section: req.body.section
        });
        await examPaper.save();

        // Save answer sheet
        const answerSheetFile = req.files.answerSheet[0];
        const AnswerSheet = require('../models/answerSheetModel');
        const answerSheet = new AnswerSheet({
            fileId: answerSheetFile.id,
            filename: answerSheetFile.filename,
            uploadedBy: req.user._id,
            examPaper: examPaper._id
        });
        await answerSheet.save();

        res.status(201).json({
            message: 'Exam paper and answer sheet uploaded successfully',
            examPaper: {
                ...examPaper._doc,
                downloadUrl: `/api/exam-papers/download/${examPaper._id}`
            },
            answerSheet: {
                ...answerSheet._doc
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading exam paper and answer sheet', error: error.message });
    }
};

const getExamPapers = async (req, res) => {
    try {
        let query = {};
        if (req.user && req.user.role === 'student') {
            // Only return papers matching the student's semester and section
            query.semester = req.user.semester;
            query.section = req.user.section;
        } else if (req.user && req.user.role === 'teacher') {
            // Only return papers uploaded by the current teacher
            query.uploadedBy = req.user._id;
        }
        const examPapers = await ExamPaper.find(query)
            .populate('uploadedBy', 'name')
            .sort({ uploadDate: -1 });

        // Get the student submissions count for each exam paper
        // We need to do this only for teachers
        let submissionCounts = {};
        
        if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
            // Get the StudentSubmission model
            let StudentSubmission;
            try {
                StudentSubmission = mongoose.model('StudentSubmission');
            } catch (error) {
                // If model doesn't exist, it might be defined in the controller file
                const submissionPath = require.resolve('../controllers/studentSubmissionController');
                require(submissionPath);
                StudentSubmission = mongoose.model('StudentSubmission');
            }
            
            // Get submission counts for all exams in one query
            const paperIds = examPapers.map(paper => paper._id);
            const submissionAggregation = await StudentSubmission.aggregate([
                { $match: { examPaper: { $in: paperIds } } },
                { $group: { _id: '$examPaper', count: { $sum: 1 } } }
            ]);
            
            // Convert to a map for easy lookup
            submissionAggregation.forEach(item => {
                submissionCounts[item._id.toString()] = item.count;
            });
        }

        const papersWithUrls = examPapers.map(paper => ({
            ...paper._doc,
            downloadUrl: `/api/exam-papers/download/${paper._id}`,
            submissionCount: submissionCounts[paper._id.toString()] || 0
        }));

        res.status(200).json(papersWithUrls);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam papers', error: error.message });
    }
};

const downloadExamPaper = async (req, res) => {
    try {
        console.log('Download request for exam paper ID:', req.params.id);
        
        const examPaper = await ExamPaper.findById(req.params.id);
        if (!examPaper) {
            console.error('Exam paper not found with ID:', req.params.id);
            return res.status(404).json({ message: 'Exam paper not found' });
        }
        
        console.log('Exam paper found:', {
            id: examPaper._id,
            fileId: examPaper.fileId,
            filename: examPaper.filename
        });

        if (!examPaper.fileId) {
            console.error('FileId is missing from the exam paper');
            return res.status(404).json({ message: 'FileId missing from exam paper' });
        }

        // Convert string to ObjectId if it's not already
        let fileId;
        try {
            fileId = typeof examPaper.fileId === 'string' ? 
                mongoose.Types.ObjectId(examPaper.fileId) : examPaper.fileId;
            console.log('Looking for file with ID:', fileId);
        } catch (err) {
            console.error('Invalid ObjectId format for fileId:', examPaper.fileId);
            return res.status(400).json({ message: 'Invalid fileId format' });
        }
        
        // Check if GridFS is initialized
        if (!gfs) {
            console.error('GridFS is not initialized');
            return res.status(500).json({ message: 'Storage system not available' });
        }
        
        try {
            const file = await gfs.find({ _id: fileId }).toArray();
            if (!file || file.length === 0) {
                console.error('File not found in GridFS for fileId:', fileId);
                return res.status(404).json({ message: 'File not found in storage' });
            }
            
            console.log('File found in GridFS:', file[0].filename);
            
            const downloadStream = gfs.openDownloadStream(fileId);
            
            // Add error handler for the stream
            downloadStream.on('error', (err) => {
                console.error('Stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error streaming file', error: err.message });
                }
            });
            
            res.set('Content-Type', 'application/pdf');  // Set appropriate content type
            res.set('Content-Disposition', `attachment; filename=${examPaper.filename}`);
            
            downloadStream.pipe(res);
            console.log('File download started');
        } catch (streamError) {
            console.error('Error accessing file stream:', streamError);
            return res.status(500).json({ message: 'Error accessing file stream', error: streamError.message });
        }
    } catch (error) {
        console.error('Error downloading exam paper:', error);
        res.status(500).json({ message: 'Error downloading file', error: error.message });
    }
};

module.exports = {
    uploadExamPaper,
    getExamPapers,
    downloadExamPaper,
    getExamPaperById
};
