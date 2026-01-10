const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    patientId: { type: String, ref: 'User', required: true },
    doctorId: { type: String, ref: 'User', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    meetingLink: { type: String }, // Jitsi Meet URL
    symptoms: { type: String },
    notes: { type: String },
    sharedReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
