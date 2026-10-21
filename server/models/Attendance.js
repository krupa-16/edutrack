const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    // Links this subject to a specific user
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subjectName: { type: String, required: true },
    // An array of date objects
    dates: [{
        date: { type: String, required: true }, // e.g., "15/10/2023"
        status: { type: String, default: 'pending' } // pending, present, absent, suspended
    }]
});

module.exports = mongoose.model('Attendance', AttendanceSchema);