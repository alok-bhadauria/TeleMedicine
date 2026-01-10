const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
    userId: { type: String, ref: 'User', required: true },
    type: { type: String, enum: ['Medicine', 'Appointment', 'General'], required: true },
    description: { type: String, required: true },
    datetime: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reminder', ReminderSchema);
