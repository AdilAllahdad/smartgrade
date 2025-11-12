const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ExamPaper',
            required: true
        },
        submission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentSubmission',
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        maxScore: {
            type: Number,
            required: true
        },
        percentage: {
            type: Number,
            required: true
        },
        evaluationDetails: {
            mcqResults: [{
                questionNumber: Number,
                studentAnswer: String,
                correctAnswer: String,
                isCorrect: Boolean,
                score: Number
            }],
            shortQuestionResults: [{
                questionNumber: Number,
                studentAnswer: String,
                modelAnswer: String,
                score: Number,
                feedback: String
            }]
        },
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        gradedAt: {
            type: Date,
            default: Date.now
        },
        feedback: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
