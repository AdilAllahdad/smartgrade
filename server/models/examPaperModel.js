const mongoose = require('mongoose');

const examPaperSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    semester: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    }
});

const ExamPaper = mongoose.model('ExamPaper', examPaperSchema);
module.exports = ExamPaper;
