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
        const backURL = req.header('Referer') || '/admin/dashboard';
        res.redirect(backURL);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Action failed');
        const backURL = req.header('Referer') || '/admin/dashboard';
        res.redirect(backURL);
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
        const activeUsersCount = await User.countDocuments({
            // Mocking active as users with at least one appointment or login recently
            // For now, let's say "Active" is not isBlocked
            isBlocked: false
        });

        // Calculate Growth Rate (Current Month vs Previous Month)
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const newUsersCurrentMonth = await User.countDocuments({
            createdAt: { $gte: startOfCurrentMonth }
        });
        const newUsersPreviousMonth = await User.countDocuments({
            createdAt: { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth }
        });

        let growthRate = 0;
        if (newUsersPreviousMonth === 0) {
            growthRate = newUsersCurrentMonth > 0 ? 100 : 0;
        } else {
            growthRate = ((newUsersCurrentMonth - newUsersPreviousMonth) / newUsersPreviousMonth) * 100;
        }
        growthRate = Math.round(growthRate);


        // Generate Analytics Data for Charts (Last 6 Months)
        const months = [];
        const growthData = [];
        const monthlyActiveData = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleString('default', { month: 'short' });
            months.push(monthName);

            // For Growth Chart: Cumulative Users up to end of this month
            // This is "Total Users", so simple count
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const count = await User.countDocuments({ createdAt: { $lte: endOfMonth } });
            growthData.push(count);

            // Mock Activity Data (random variation around 40-80% of total) per month
            monthlyActiveData.push(Math.floor(count * (0.4 + Math.random() * 0.4)));
        }

        const analyticsData = {
            roles: [totalPatients, totalDoctors],
            growth: growthData,
            monthlyActive: monthlyActiveData,
            labels: months
        };

        res.render('pages/dashboards/admin_analytics', {
            user: req.user,
            title: 'Platform Analytics',
            stats: {
                totalDoctors,
                totalPatients,
                activeUsers: activeUsersCount,
                growthRate: growthRate
            },
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
        const doctors = await User.find({ role: 'doctor' }).sort({ createdAt: -1 });
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


// Get Manage Patients Page
exports.getManagePatients = async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        const Report = require('../models/Report');

        // Fetch all patients sort by newest
        const patients = await User.find({ role: 'patient' }).sort({ createdAt: -1 });

        // Augment patient objects with stats (recent appt, reports count)
        // Since we can't easily modify mongoose docs, we'll map them to plain objects or use Promise.all
        // Using Promise.all for parallel fetching might be slow if 1000s of users, 
        // but for < 100 it's fine. For scaling, would use aggregation.
        // Let's use aggregation for efficiency.

        // Simpler approach for now:
        const patientsWithStats = await Promise.all(patients.map(async (p) => {
            const reportCount = await Report.countDocuments({ patientId: p._id });
            const lastAppt = await Appointment.findOne({ patientId: p._id }).sort({ date: -1 });

            return {
                ...p.toObject(),
                reportCount,
                lastAppointmentDate: lastAppt ? lastAppt.date : null
            };
        }));


        res.render('pages/dashboards/admin_patients', {
            user: req.user,
            title: 'Manage Patients',
            patients: patientsWithStats
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

// Get Meeting Requests Page
exports.getMeetingRequests = async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        // Fetch Appointments of type 'admin-meeting'
        // Status 'pending' for Requests list
        // Status 'confirmed' for Upcoming list

        const pendingRequests = await Appointment.find({ type: 'admin-meeting', status: 'pending' })
            .populate('doctorId', 'fullName profilePic speciality');

        const upcomingMeetings = await Appointment.find({ type: 'admin-meeting', status: 'confirmed' })
            .populate('doctorId', 'fullName profilePic speciality')
            .sort({ date: 1 });

        res.render('pages/dashboards/admin_meetings', {
            user: req.user,
            title: 'Meeting Requests',
            pendingRequests,
            upcomingMeetings
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Handle Meeting Action (Approve/Reject)
exports.handleMeetingAction = async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        const { appointmentId, action } = req.body; // Changed doctorId to appointmentId

        if (action === 'approve') {
            await Appointment.findByIdAndUpdate(appointmentId, { status: 'confirmed' });

            // Should update Doctor's status flag too to keep sync? Optional but safe.
            const appt = await Appointment.findById(appointmentId);
            await User.findByIdAndUpdate(appt.doctorId, { meetingRequestStatus: 'approved' });

            req.flash('success_msg', 'Meeting approved');
        } else {
            const appt = await Appointment.findByIdAndUpdate(appointmentId, { status: 'cancelled' });
            await User.findByIdAndUpdate(appt.doctorId, { meetingRequestStatus: 'rejected' });
            req.flash('info_msg', 'Meeting request declined');
        }
        res.redirect('/admin/meetings');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Action failed');
        res.redirect('/admin/meetings');
    }
};
