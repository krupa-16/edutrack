const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    
    // --- STREAK DATA ---
    // Tracks consecutive days of completed tasks
    streak: { 
        type: Number, 
        default: 0 
    },
    
    // Stores the last completion date in 'DD/MM/YYYY' format 
    // to compare against the server's current date
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