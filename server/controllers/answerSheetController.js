const mongoose = require('mongoose');
const AnswerSheet = require('../models/answerSheetModel');

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

const getAnswerSheets = async (req, res) => {
    try {
        let query = {};
        
        // If user is a teacher, get all answer sheets they uploaded
        if (req.user && req.user.role === 'teacher') {
            query.uploadedBy = req.user._id;
        }
        
        const answerSheets = await AnswerSheet.find(query)
            .populate('uploadedBy', 'name')
            .populate('examPaper', 'title semester section')
            .sort({ uploadDate: -1 });

        const sheetsWithUrls = answerSheets.map(sheet => {
            // Add both examPaper and examPaperId for compatibility
            const examPaperId = sheet.examPaper && sheet.examPaper._id 
                ? sheet.examPaper._id.toString() 
                : (sheet.examPaper ? sheet.examPaper.toString() : null);
                
            return {
                ...sheet._doc,
                downloadUrl: `/api/answer-sheets/download/${sheet._id}`,
                examPaperId: examPaperId
            };
        });

        res.status(200).json(sheetsWithUrls);
    } catch (error) {
        console.error('Error fetching answer sheets:', error);
        res.status(500).json({ message: 'Error fetching answer sheets', error: error.message });
    }
};

const downloadAnswerSheet = async (req, res) => {
    try {
        console.log('Download request for answer sheet ID:', req.params.id);
        
        const answerSheet = await AnswerSheet.findById(req.params.id);
        if (!answerSheet) {
            console.error('Answer sheet not found with ID:', req.params.id);
            return res.status(404).json({ message: 'Answer sheet not found' });
        }
        
        console.log('Answer sheet found:', {
            id: answerSheet._id,
            fileId: answerSheet.fileId,
            filename: answerSheet.filename
        });

        if (!answerSheet.fileId) {
            console.error('FileId is missing from the answer sheet');
            return res.status(404).json({ message: 'FileId missing from answer sheet' });
        }

        // Convert string to ObjectId if it's not already
        let fileId;
        try {
            fileId = typeof answerSheet.fileId === 'string' ? 
                mongoose.Types.ObjectId(answerSheet.fileId) : answerSheet.fileId;
            console.log('Looking for file with ID:', fileId);
        } catch (err) {
            console.error('Invalid ObjectId format for fileId:', answerSheet.fileId);
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
            res.set('Content-Disposition', `attachment; filename=${answerSheet.filename}`);
            
            downloadStream.pipe(res);
            console.log('File download started');
        } catch (streamError) {
            console.error('Error accessing file stream:', streamError);
            return res.status(500).json({ message: 'Error accessing file stream', error: streamError.message });
        }
    } catch (error) {
        console.error('Error downloading answer sheet:', error);
        res.status(500).json({ message: 'Error downloading answer sheet', error: error.message });
    }
};

module.exports = {
    getAnswerSheets,
    downloadAnswerSheet
};
