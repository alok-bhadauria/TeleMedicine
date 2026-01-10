const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { forwardAuthenticated } = require('../middleware/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('pages/login', { title: 'MediConnect | Login', isHome: true }));

// Signup Page
router.get('/signup', forwardAuthenticated, (req, res) => res.render('pages/signup', { title: 'MediConnect | Signup', isHome: true }));

// Auth Handles
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Google OAuth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
    (req, res) => {
        // Successful authentication
        res.redirect('/dashboard');
    }
);

module.exports = router;
