const User = require('../models/User');

// Get Admin Stats & Data
exports.getAdminDashboard = async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        const Report = require('../models/Report');

        const totalDoctors = await User.countDocuments({ role: 'doctor' });
        const totalPatients = await User.countDocuments({ role: 'patient' });
        const pendingDoctors = await User.find({ role: 'doctor', verificationStatus: 'pending' });

        // Appointment Stats
        const pendingAppointments = await Appointment.countDocuments({ status: { $in: ['pending', 'confirmed'] } });
        const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
        const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });

        // Other Stats for 3rd Chart
        const totalReports = await Report.countDocuments({});
        const totalAppointments = await Appointment.countDocuments({});

        const analyticsData = {
            users: {
                labels: ['Patients', 'Doctors'],
                data: [totalPatients, totalDoctors]
            },
            appointments: {
                labels: ['Pending/Confirmed', 'Completed', 'Cancelled'],
                data: [pendingAppointments, completedAppointments, cancelledAppointments]
            },
            activity: {
                labels: ['Total Appointments', 'Total Reports'],
                data: [totalAppointments, totalReports]
            }
        };

        res.render('pages/dashboards/admin', {
            user: req.user,
            title: 'Admin Dashboard',
            stats: { totalDoctors, totalPatients, pendingCount: pendingDoctors.length },
            pendingDoctors
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Verify Doctor
exports.verifyDoctor = async (req, res) => {
    try {
        const { doctorId, action } = req.body; // action: 'approve' or 'reject'
        const status = action === 'approve' ? 'verified' : 'suspended';

        await User.findByIdAndUpdate(doctorId, { verificationStatus: status });

        req.flash('success_msg', `Doctor ${action}d successfully`);
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Action failed');
        res.redirect('/admin/dashboard');
    }
};

// Toggle Block User
exports.toggleBlockUser = async (req, res) => {
    try {
        const { userId, blockStatus } = req.body; // blockStatus: 'true' or 'false'
        await User.findByIdAndUpdate(userId, { isBlocked: blockStatus === 'true' });
        req.flash('success_msg', `User ${blockStatus === 'true' ? 'blocked' : 'unblocked'} successfully`);
        res.redirect('back');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Action failed');
        res.redirect('back');
    }
};

// Search Users
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        // Search by Name or ID
        const users = await User.find({
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { _id: query } // Exact match for ID
            ]
        });

        // Render a search results page or reuse a list page
        res.render('pages/admin_search_results', { users, query, user: req.user, title: 'Search Results' });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Search failed');
        res.redirect('/admin/dashboard');
    }
};

// Get Analytics Page
exports.getAnalytics = async (req, res) => {
    try {
        const totalDoctors = await User.countDocuments({ role: 'doctor' });
        const totalPatients = await User.countDocuments({ role: 'patient' });
        const activeUsers = await User.countDocuments({ /* active logic */ }); // Placeholder

        const analyticsData = {
            roles: [totalPatients, totalDoctors],
            growth: [10, 20, 15, 25, 30, 45, totalPatients + totalDoctors], // Mock data
            monthlyActive: [5, 10, 8, 15, 20, 25, 30]
        };

        res.render('pages/dashboards/admin_analytics', {
            user: req.user,
            title: 'Platform Analytics',
            stats: { totalDoctors, totalPatients, activeUsers },
            analyticsData: JSON.stringify(analyticsData)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get Manage Doctors Page
exports.getManageDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' });
        res.render('pages/dashboards/admin_doctors', {
            user: req.user,
            title: 'Manage Doctors',
            doctors
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// API: Get Analytics Data JSON
exports.getAnalyticsData = async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        const Report = require('../models/Report');

        const totalDoctors = await User.countDocuments({ role: 'doctor' });
        const totalPatients = await User.countDocuments({ role: 'patient' });

        const pendingAppointments = await Appointment.countDocuments({ status: { $in: ['pending', 'confirmed'] } });
        const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
        const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });

        const totalReports = await Report.countDocuments({});
        const totalAppointments = await Appointment.countDocuments({});

        const analyticsData = {
            users: {
                labels: ['Patients', 'Doctors'],
                data: [totalPatients, totalDoctors]
            },
            appointments: {
                labels: ['Pending', 'Completed', 'Cancelled'],
                data: [pendingAppointments, completedAppointments, cancelledAppointments]
            },
            activity: {
                labels: ['Appointments', 'Reports'],
                data: [totalAppointments, totalReports]
            }
        };

        res.json(analyticsData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};
