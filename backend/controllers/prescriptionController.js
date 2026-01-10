const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');

// Create Prescription
// Create Prescription
exports.createPrescription = async (req, res) => {
    try {
        const { appointmentId, patientId, medicines, advice } = req.body;

        // Handle medicines if provided, otherwise empty array
        let medicinesArray = [];
        if (medicines && typeof medicines === 'string') {
            try {
                medicinesArray = JSON.parse(medicines);
            } catch (e) {
                medicinesArray = [];
            }
        } else if (Array.isArray(medicines)) {
            medicinesArray = medicines;
        }

        const newPrescription = new Prescription({
            appointmentId,
            patientId,
            doctorId: req.user.id,
            medicines: medicinesArray,
            advice: advice || ''
        });

        await newPrescription.save();

        // Mark appointment as completed
        await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });

        req.flash('success_msg', 'Prescription sent successfully');
        res.redirect('/patients'); // Redirect back to patients list
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error creating prescription');
        res.redirect('/patients');
    }
};

// View Prescription
exports.getPrescription = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('doctorId', 'fullName speciality')
            .populate('patientId', 'fullName');

        res.render('pages/view_prescription', { prescription, user: req.user, title: 'MediConnect | Prescription' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
