const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/database');

// Load env vars
dotenv.config({ path: '../.env' }); // Adjusted path for running from seeds/ dir if needed, but safe to assume run from root usually or adjust. 
// Actually, let's assume we run strict node backend/seeds/seedAdmin.js
// So .env is in backend/.env

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@telemedicine.com';
        const user = await User.findOne({ email: adminEmail });

        if (user) {
            console.log('Admin user already exists');
            process.exit();
        }

        const newAdmin = new User({
            _id: 'ADM00001',
            fullName: 'System Administrator',
            email: adminEmail,
            password: 'admin123', // Will be hashed by pre-save hook
            role: 'admin',
            mobileNumber: '0000000000'
        });

        await newAdmin.save();
        console.log('Admin user created successfully');
        console.log('Email: admin@telemedicine.com');
        console.log('Password: admin123');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
