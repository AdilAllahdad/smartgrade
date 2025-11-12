const mongoose = require('mongoose');

const answerSheetSchema = new mongoose.Schema({
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
    examPaper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamPaper',
        required: true
    }
});

const AnswerSheet = mongoose.model('AnswerSheet', answerSheetSchema);
module.exports = AnswerSheet;
