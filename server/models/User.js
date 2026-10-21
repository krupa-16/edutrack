
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 254
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    streak: {
        type: Number,
        default: 0,
        min: 0
    },
    lastDate: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('User', UserSchema);
