const mongoose = require('mongoose');

const HealthTrackSchema = new mongoose.Schema({
    patientId: { type: String, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['heart_rate', 'blood_pressure', 'weight', 'sugar_level', 'temperature', 'other'],
        required: true
    },
    value: { type: String, required: true }, // String to accommodate "120/80"
    recordedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthTrack', HealthTrackSchema);
