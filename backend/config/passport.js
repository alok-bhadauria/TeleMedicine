const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const generateUserId = require('../utils/idGenerator');

module.exports = function (passport) {
    // Local Strategy
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email: email });
            if (!user) {
                return done(null, false, { message: 'That email is not registered' });
            }

            // Match password
            const isMatch = await user.matchPassword(password);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect' });
            }
        } catch (err) {
            return done(err);
        }
    }));

    // Google Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists
            const existingUser = await User.findOne({ googleId: profile.id });
            if (existingUser) {
                return done(null, existingUser);
            }

            // Check if email exists to merge? Maybe, but for now strict separation or auto-merge
            const userByEmail = await User.findOne({ email: profile.emails[0].value });
            if (userByEmail) {
                userByEmail.googleId = profile.id;
                await userByEmail.save();
                return done(null, userByEmail);
            }

            // Create new User
            const userId = await generateUserId('patient'); // Default to patient for Google Auth
            const newUser = new User({
                _id: userId,
                googleId: profile.id,
                fullName: profile.displayName,
                email: profile.emails[0].value,
                profilePic: profile.photos[0].value,
                role: 'patient'
            });
            await newUser.save();
            done(null, newUser);

        } catch (err) {
            console.error(err);
            done(err, null);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
