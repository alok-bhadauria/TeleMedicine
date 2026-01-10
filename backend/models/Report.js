const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    patientId: { type: String, ref: 'User', required: true },
    doctorId: { type: String, ref: 'User' },
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: {
        type: String,
        enum: ['blood_test', 'xray', 'mri', 'prescription', 'other'],
        default: 'other'
    },
    mimeType: { type: String }, // 'image/png', 'application/pdf', etc.
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
