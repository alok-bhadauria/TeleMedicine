const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patientId: { type: String, ref: 'User', required: true },
    doctorId: { type: String, ref: 'User', required: true },
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
        notes: { type: String }
    }],
    advice: { type: String },
    issuedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
