const Reminder = require('../models/Reminder');

// Get Reminders Page
exports.getRemindersPage = async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.user._id }).sort({ datetime: 1 });

        // Analytics calculations
        const total = reminders.length;
        const completed = reminders.filter(r => r.isCompleted).length;
        const pending = total - completed;

        const typeCounts = {
            Medicine: reminders.filter(r => r.type === 'Medicine').length,
            Appointment: reminders.filter(r => r.type === 'Appointment').length,
            General: reminders.filter(r => r.type === 'General').length
        };

        const analyticsData = {
            overview: [completed, pending],
            types: [typeCounts.Medicine, typeCounts.Appointment, typeCounts.General]
        };

        res.render('pages/reminders', {
            title: 'My Reminders',
            reminders,
            analyticsData: JSON.stringify(analyticsData),
            user: req.user
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not load reminders');
        res.redirect('/dashboard');
    }
};

// Add Reminder
exports.addReminder = async (req, res) => {
    try {
        const { type, description, datetime } = req.body;
        const newReminder = new Reminder({
            userId: req.user._id,
            type,
            description,
            datetime
        });
        await newReminder.save();
        req.flash('success_msg', 'Reminder added successfully');

        if (req.query.redirect === 'dashboard') {
            if (req.user.role === 'doctor') {
                res.redirect('/doctor/dashboard');
            } else {
                res.redirect('/patient/dashboard');
            }
        } else {
            res.redirect('/reminders');
        }
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error adding reminder');
        res.redirect('/reminders');
    }
};

// Toggle Complete
exports.toggleComplete = async (req, res) => {
    try {
        const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
        if (!reminder) {
            req.flash('error_msg', 'Reminder not found');
            return res.redirect('/reminders');
        }
        reminder.isCompleted = !reminder.isCompleted;
        await reminder.save();
        req.flash('success_msg', 'Reminder updated');
        res.redirect('/reminders');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating reminder');
        res.redirect('/reminders');
    }
};

// Delete Reminder
exports.deleteReminder = async (req, res) => {
    try {
        await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        req.flash('success_msg', 'Reminder deleted');
        res.redirect('/reminders');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting reminder');
        res.redirect('/reminders');
    }
};

// Get Reminders Data (API for Charts)
exports.getRemindersData = async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.user._id }).sort({ datetime: 1 });
        res.json(reminders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
