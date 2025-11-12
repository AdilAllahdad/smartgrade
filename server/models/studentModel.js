const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // Adding validation for name format
        validate: {
            validator: function(v) {
                return /^[a-zA-Z\s]+$/.test(v);
            },
            message: props => `${props.value} is not a valid name! Name should only contain letters and spaces.`
        }
    },
    guardian: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guardian',
        // Not required as it's set after the student is created
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true,
        // Adding validation for email format
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required: true
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true,
        // Adding validation for roll number format with more flexibility (e.g., SP22-BSE-006, SP22-BSE-123, etc.)
        validate: {
            validator: function(v) {
                return /^[FSP][ASP]\d{2}-[A-Z]{2,3}-\d{3,4}$/.test(v);
            },
            message: props => `${props.value} is not a valid roll number format! Expected format: SP22-BSE-006 (or similar with 3-4 digits at the end)`
        }
    },
    role: {
        type: String,
        default: 'student'
    },
    semester: {
        type: String,
        required: function() { return this.role === 'student'; }
    },
    section: {
        type: String,
        required: function() { return this.role === 'student'; }
    }
}, {
    timestamps: true
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
studentSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
