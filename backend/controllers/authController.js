const passport = require('passport');
const User = require('../models/User');
const generateUserId = require('../utils/idGenerator');

// Signup
exports.signup = async (req, res) => {
    try {
        const { fullName, email, password, role, mobileNumber, speciality, qualification, experience, charges, bio } = req.body;

        // Basic validation
        if (!email || !password || !fullName) {
            req.flash('error_msg', 'Please fill in all required fields');
            return res.redirect('/signup');
        }

        // Check availability
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            req.flash('error_msg', 'Email already exists');
            return res.redirect('/signup');
        }

        const userId = await generateUserId(role || 'patient');

        const newUser = new User({
            _id: userId,
            fullName,
            email,
            password,
            role,
            mobileNumber
        });

        // Add doctor specific fields
        if (role === 'doctor') {
            newUser.speciality = speciality;
            newUser.qualification = qualification;
            newUser.experience = experience;
            newUser.charges = charges;
            newUser.bio = bio;
        }

        await newUser.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/login');

    } catch (err) {
        console.error("Signup Error:", err);
        req.flash('error_msg', 'Error during registration: ' + err.message);
        res.redirect('/signup');
    }
};

// Login
exports.login = (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
};

// Logout
exports.logout = (req, res, next) => { // Updated to support async logout in newer passport versions if needed
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/login');
    });
};

// Google OAuth Callback logic is handled in routes directly usually, or we can add a method here if needed
