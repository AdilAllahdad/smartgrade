const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const guardianSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z\s]+$/.test(v);
            },
            message: props => `${props.value} is not a valid name! Name should only contain letters and spaces.`
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    phoneNumber: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                // Supports formats: +92XXXXXXXXXX, 03XXXXXXXXX, +1XXXXXXXXXX
                return /^(\+\d{1,3})?\d{10,12}$/.test(v.replace(/[\s-]/g, ''));
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'guardian'
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: false // Make it optional during creation
    }
}, {
    timestamps: true
});

// Hash password before saving
guardianSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
guardianSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Guardian = mongoose.model('Guardian', guardianSchema);

module.exports = Guardian;