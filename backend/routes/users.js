const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const multer = require('multer');

const adminController = require('../controllers/adminController');

// Dashboard Redirect
router.get('/dashboard', ensureAuthenticated, userController.getDashboard);

// Dashboard Views (Protected by Role)
router.get('/patient/dashboard', ensureAuthenticated, ensureRole('patient'), userController.getPatientDashboard);

router.get('/doctor/dashboard', ensureAuthenticated, ensureRole('doctor'), userController.getDoctorDashboard);

router.get('/admin/dashboard', ensureAuthenticated, ensureRole('admin'), adminController.getAdminDashboard);

// Admin Actions
router.post('/admin/verify', ensureAuthenticated, ensureRole('admin'), adminController.verifyDoctor);
router.post('/admin/block', ensureAuthenticated, ensureRole('admin'), adminController.toggleBlockUser);
router.get('/admin/search', ensureAuthenticated, ensureRole('admin'), adminController.searchUsers);
router.get('/admin/analytics', ensureAuthenticated, ensureRole('admin'), adminController.getAnalytics);
router.get('/admin/doctors', ensureAuthenticated, ensureRole('admin'), adminController.getManageDoctors);

// Public/Patient: Find Doctors
router.get('/doctors', ensureAuthenticated, userController.getAllDoctors);

// Doctor: My Patients
router.get('/patients', ensureAuthenticated, ensureRole('doctor'), userController.getMyPatients);

// Profile
router.get('/profile', ensureAuthenticated, userController.getProfile);
router.post('/profile/update', ensureAuthenticated, (req, res, next) => {
    upload.single('profilePic')(req, res, (err) => {
        if (err) {
            console.error("Profile Upload Error:", err);
            // Handle Multer/Cloudinary errors gracefully
            let message = 'Error uploading image.';
            if (err.message) message = err.message;
            if (err instanceof multer.MulterError) message = err.message;

            req.flash('error_msg', message);
            return res.redirect('/profile');
        }
        next();
    });
}, userController.updateProfile);
router.post('/profile/change-password', ensureAuthenticated, userController.changePassword);

// New Patient Pages
router.get('/prescriptions', ensureAuthenticated, ensureRole('patient'), userController.getPrescriptions);
router.get('/health-track', ensureAuthenticated, ensureRole('patient'), userController.getHealthTrack);
router.get('/reports', ensureAuthenticated, ensureRole('patient'), userController.getReports);

// Video Call
router.get('/video-call/:id', ensureAuthenticated, userController.getVideoCall);

module.exports = router;
