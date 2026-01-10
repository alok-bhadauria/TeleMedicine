const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./users');
const appointmentRoutes = require('./appointments');
const messageRoutes = require('./messages');
const reportRoutes = require('./reports');
const prescriptionRoutes = require('./prescriptions');
const vitalsRoutes = require('./vitals');
const chatbotRoutes = require('./chatbot');
const feedbackRoutes = require('./feedback');

// Landing Page
router.get('/', (req, res) => {
    res.render('pages/landing', { title: 'MediConnect | Home', user: req.user, isHome: true });
});

// Mount Routes
router.use('/', authRoutes);
router.use('/', userRoutes); // Profile & Dashboards are on root/ or generic paths
router.use('/appointments', appointmentRoutes);
router.use('/messages', messageRoutes);
router.use('/reports', reportRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/vitals', vitalsRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/reminders', require('./reminders'));

// 404
// router.use((req, res) => {
//    res.status(404).render('pages/404');
// });

module.exports = router;
