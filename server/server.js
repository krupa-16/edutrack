require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose'); // Make sure this is here!
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- THIS IS THE PART THAT CONNECTS TO YOUR LINK ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully!")) 
    .catch(err => console.log("❌ Connection Error:", err));
// ----------------------------------------------------

app.get('/', (req, res) => {
    res.send("Server is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🔥 Server is running on http://localhost:${PORT}`);
    console.log("Keep this terminal open!");
});
// 1. At the very top (add this line):
const authRoutes = require('./routes/authRoutes');

// 2. Below your middlewares (add this line):
app.use('/api/auth', authRoutes);
// ... existing imports
const attendanceRoutes = require('./routes/attendanceRoutes');

// ... after your other app.use calls
app.use('/api/attendance', attendanceRoutes);
const plannerRoutes = require('./routes/plannerRoutes');
app.use('/api/planner', plannerRoutes);
// Tell Node to serve your frontend files from the 'client' folder
app.use(express.static('client'));
// Add this at the end of server.js
module.exports = app;