const express = require('express');
const router = express.Router();
const Planner = require('../models/Planner');
const User = require('../models/User');

// --- 1. GET ALL ENTRIES FOR A USER ---
router.get('/:userId', async (req, res) => {
    try {
        const entries = await Planner.find({ userId: req.params.userId }).sort({ date: 1 });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch entries" });
    }
});

// --- 2. ADD NEW ENTRY (TASK/ASSIGNMENT/EXAM) ---
router.post('/add', async (req, res) => {
    try {
        const newEntry = new Planner(req.body);
        await newEntry.save();
        res.status(201).json(newEntry);
    } catch (err) {
        res.status(400).json({ error: "Failed to save entry" });
    }
});

// --- 3. UPDATE TASK STATUS + STREAK LOGIC ---
// --- 3. UPDATE TASK STATUS + STREAK LOGIC ---
router.patch('/update/:id', async (req, res) => {
    try {
        const { status, userId } = req.body;

        // 1. Update the specific task/entry status
        const entry = await Planner.findByIdAndUpdate(req.params.id, { 
            status, 
            completedDate: status === 'completed' ? new Date() : null 
        }, { new: true });

        // --- START OF STREAK ENGINE ---
        let updatedStreak = null;

        if (status === 'completed' && userId) {
            const user = await User.findById(userId);
            const today = new Date().toLocaleDateString('en-GB'); // Format: DD/MM/YYYY
            
            // Only update streak if they haven't earned a point already today
            if (user.lastDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toLocaleDateString('en-GB');

                // If last activity was yesterday -> Streak + 1
                // If last activity was older -> Reset to 1
                user.streak = (user.lastDate === yesterdayStr) ? (user.streak + 1) : 1;
                
                user.lastDate = today;
                await user.save();
            }
            // We set this here so the frontend always knows the current streak
            updatedStreak = user.streak;
        }
        // --- END OF STREAK ENGINE ---

        // Send both the updated task AND the new streak back to the client
        res.json({ entry, updatedStreak });

    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: "Update failed" });
    }
});

// --- 4. TOGGLE EXAM SUBTASK ---
router.patch('/subtask/:id', async (req, res) => {
    try {
        const { subIndex } = req.body;
        const entry = await Planner.findById(req.params.id);
        
        // Flip the boolean for the specific subtask
        entry.subtasks[subIndex].done = !entry.subtasks[subIndex].done;
        
        await entry.save();
        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: "Subtask update failed" });
    }
});

// --- 5. DELETE ENTRY ---
router.delete('/delete/:id', async (req, res) => {
    try {
        await Planner.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});
// --- MISSING: SYNC STREAK (Called on window.onload) ---
// plannerRoutes.js
router.post('/sync-streak', async (req, res) => {
    try {
        const { userId } = req.body;

        // SAFETY CHECK: If userId is missing or invalid, don't crash the server
        if (!userId || userId === "undefined") {
            return res.status(400).json({ error: "Valid User ID required" });
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const today = new Date().toLocaleDateString('en-GB');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-GB');

        // Reset streak to 0 if they missed yesterday AND haven't done anything today
        if (user.lastDate !== today && user.lastDate !== yesterdayStr) {
            user.streak = 0;
            await user.save();
        }
        res.json({ streak: user.streak });
    } catch (err) {
        console.error("Sync-streak Error:", err); // This shows the exact error in your terminal
        res.status(500).json({ error: "Internal server error during sync" });
    }
});

// --- MISSING: GET STATS (Called by getFullPlannerStats) ---
router.get('/stats/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const entries = await Planner.find({ userId });
        const user = await User.findById(userId);

        const total = entries.length;
        const done = entries.filter(e => e.status === 'completed').length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        res.json({
            overall: { total, done, percent },
            streak: user.streak
        });
    } catch (err) {
        res.status(500).json({ error: "Stats fetch failed" });
    }
});
module.exports = router;