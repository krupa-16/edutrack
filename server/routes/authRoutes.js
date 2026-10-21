const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Used to scramble passwords
const User = require('../models/User');

// Route: POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "Email already registered" });

        // Scramble (Hash) the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save to MongoDB
        user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: "Student registered successfully! 🎉" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});
// Route: POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found!" });

        // 2. Compare the entered password with the hashed one in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password!" });

        // 3. Success! Send back the user info
        res.status(200).json({ 
            message: "Login successful!",
            userId: user._id,
            username: user.username,
            email: user.email 
        });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});
module.exports = router;