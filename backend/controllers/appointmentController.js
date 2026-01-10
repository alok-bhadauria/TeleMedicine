const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Create Appointment
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, timeSlot, symptoms, sharedReports } = req.body;
        const patientId = req.user.id;

        const newAppointment = new Appointment({
            patientId,
            doctorId,
            date,
            timeSlot,
            symptoms,
            sharedReports: sharedReports || [], // Ensure array
            status: 'pending'
        });

        await newAppointment.save();
        req.flash('success_msg', 'Appointment booked successfully');
        res.redirect('/patient/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not book appointment');
        res.redirect('/patient/dashboard');
    }
};

// Get Appointments (for Patient or Doctor)
exports.getAppointments = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient') {
            query = { patientId: req.user.id };
        } else if (req.user.role === 'doctor') {
            query = { doctorId: req.user.id };
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'fullName profilePic')
            .populate('doctorId', 'fullName speciality')
            .populate('sharedReports')
            .sort({ createdAt: -1 });

        res.render('pages/appointments', { appointments, user: req.user, title: 'MediConnect | Appointments' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Update Status (Doctor Cancel/Confirm)
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status, meetingLink } = req.body;
        const updateData = { status };

        if (meetingLink) updateData.meetingLink = meetingLink;

        await Appointment.findByIdAndUpdate(req.params.id, updateData);
        req.flash('success_msg', 'Appointment updated');
        res.redirect('/doctor/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating appointment');
        res.redirect('/doctor/dashboard');
    }
};
