const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');

// Book Appointment
router.post('/book', ensureAuthenticated, ensureRole('patient'), appointmentController.bookAppointment);

// List Appointments
router.get('/', ensureAuthenticated, appointmentController.getAppointments);

// Update Status (Doctor)
router.post('/:id/update', ensureAuthenticated, ensureRole('doctor'), appointmentController.updateAppointmentStatus);

// Cancel (Patient/Doctor) - reusing update but maybe with stricter checks in controller, for now simple
// router.post('/:id/cancel', ensureAuthenticated, appointmentController.cancelAppointment); // If implemented

module.exports = router;
