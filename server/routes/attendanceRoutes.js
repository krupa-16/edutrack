const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// 1. GET ALL SUBJECTS for a specific user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // CHECK: Is the ID "undefined" or an invalid format?
        if (userId === "undefined" || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid or missing User ID. Please log in again." });
        }

        const data = await Attendance.find({ userId: userId });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. CREATE A NEW SCHEDULE (The "Generate" part)
router.post('/add', async (req, res) => {
    const { userId, subjectName, dates } = req.body;
    try {
        const newSubject = new Attendance({ userId, subjectName, dates });
        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. PUSH EXTRA CLASS (The "Extra Class" part)
router.patch('/extra-class', async (req, res) => {
    const { subjectId, date } = req.body;
    try {
        const updated = await Attendance.findByIdAndUpdate(
            subjectId,
            { $push: { dates: { date: date + " (Extra)", status: 'present' } } },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Update P/A/S status for a specific date
router.patch('/update-status', async (req, res) => {
    const { subjectId, dateIndex, status } = req.body;
    try {
        const subject = await Attendance.findById(subjectId);
        if (!subject) return res.status(404).json({ message: "Subject not found" });

        subject.dates[dateIndex].status = status; 
        await subject.save();
        res.json({ message: "Status updated in cloud!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 5. DELETE A SUBJECT
router.delete('/:id', async (req, res) => {
    try {
        const deletedSubject = await Attendance.findByIdAndDelete(req.params.id);
        if (!deletedSubject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json({ message: "Subject removed successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;