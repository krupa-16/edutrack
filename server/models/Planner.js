const mongoose = require('mongoose');

const PlannerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: ['task', 'assignment', 'exam'], 
        required: true 
    },
    title: { type: String, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    date: { type: String, required: true }, 
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    completedDate: { type: Date },
    // Specifically for Exams
    subtasks: [{
        title: String,
        done: { type: Boolean, default: false }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Planner', PlannerSchema);