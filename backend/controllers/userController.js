const User = require('../models/User');

// Get User Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.render('pages/profile', { user: user, title: 'Profile' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
    try {
        const {
            fullName, mobileNumber, dob, gender, bloodGroup, address, emergencyContact,
            speciality, qualification, experience, charges, clinicLat, clinicLng
        } = req.body;

        // Whitelist allowed updates
        const updates = {
            fullName,
            mobileNumber,
            dob,
            gender,
            bloodGroup,
            address,
            emergencyContact,
            speciality,
            qualification,
            experience,
            charges
        };

        if (clinicLat && clinicLng) {
            updates.clinicLocation = {
                lat: parseFloat(clinicLat),
                lng: parseFloat(clinicLng)
            };
        }

        if (req.file) {
            updates.profilePic = req.file.path;
        }

        // Remove undefined/empty fields from updates
        Object.keys(updates).forEach(key => (updates[key] === undefined || updates[key] === '') && delete updates[key]);

        await User.findByIdAndUpdate(req.user.id, updates);
        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not update profile');
        res.redirect('/profile');
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            req.flash('error_msg', 'New passwords do not match');
            return res.redirect('/profile');
        }

        const user = await User.findById(req.user.id);

        // Verify old password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            req.flash('error_msg', 'Incorrect current password');
            return res.redirect('/profile');
        }

        if (req.body.charges) user.charges = req.body.charges;
        if (req.body.bio) user.bio = req.body.bio;

        // Update Clinic Location if provided
        if (req.body.clinicLat && req.body.clinicLng) {
            user.clinicLocation = {
                lat: parseFloat(req.body.clinicLat),
                lng: parseFloat(req.body.clinicLng)
            };
        }

        // Update password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        req.flash('success_msg', 'Password changed successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error changing password');
        res.redirect('/profile');
    }
};

// Dashboard Route (Delegates to specific dashboards based on role)
exports.getDashboard = (req, res) => {
    const role = req.user.role;
    if (role === 'doctor') {
        res.redirect('/doctor/dashboard');
    } else if (role === 'admin') {
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/patient/dashboard');
    }
};

// Get Patient Dashboard Data
exports.getPatientDashboard = async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        const HealthTrack = require('../models/HealthTrack');

        // Next Appointment
        const nextAppointment = await Appointment.findOne({
            patientId: req.user.id,
            status: 'confirmed',
            date: { $gte: new Date() }
        })
            .sort({ date: 1 })
            .populate('doctorId', 'fullName speciality');

        // Recent Vitals (for chart/preview)
        const recentVitals = await HealthTrack.find({ patientId: req.user.id })
            .sort({ recordedAt: -1 })
            .limit(5);

        res.render('pages/dashboards/patient', {
            user: req.user,
            title: 'Patient Dashboard',
            nextAppointment,
            recentVitals
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get Doctor Dashboard Data
exports.getDoctorDashboard = async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');

        // Stats
        const pendingRequestsCount = await Appointment.countDocuments({ doctorId: req.user.id, status: 'pending' });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todaysAppointmentsCount = await Appointment.countDocuments({
            doctorId: req.user.id,
            status: 'confirmed',
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        // Total Unique Patients
        const distinctPatients = await Appointment.distinct('patientId', { doctorId: req.user.id });
        const totalPatientsCount = distinctPatients.length;

        // Recent Requests
        const recentRequests = await Appointment.find({ doctorId: req.user.id, status: 'pending' })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('patientId', 'fullName')
            .populate('sharedReports');

        res.render('pages/dashboards/doctor', {
            user: req.user,
            title: 'Doctor Dashboard',
            stats: {
                pendingRequestsCount,
                todaysAppointmentsCount,
                totalPatientsCount
            },
            recentRequests
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// GetAllDoctors
exports.getAllDoctors = async (req, res) => {
    try {
        let query = { role: 'doctor', verificationStatus: 'verified' };

        // Search Filter
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { fullName: searchRegex },
                { speciality: searchRegex },
                { _id: req.query.search } // Exact match for ID usually, or regex if string ID
            ];
            // Since IDs are custom strings like PAT..., regex works too
            query.$or[2] = { _id: searchRegex };
        }

        const doctors = await User.find(query);

        // Fetch patient's reports to allow sharing during booking
        let patientReports = [];
        if (req.user.role === 'patient') {
            const Report = require('../models/Report');
            patientReports = await Report.find({ patientId: req.user.id }).sort({ uploadedAt: -1 });
        }

        res.render('pages/doctors_list', {
            doctors,
            user: req.user,
            title: 'Find Doctors',
            search: req.query.search || '',
            reports: patientReports
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// GetMyPatients (For Doctors: list patients who have appointments with me)
// GetMyPatients (For Doctors: list patients who have appointments with me)
exports.getMyPatients = async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        console.log("Fetching patients for doctor:", req.user.id);

        // Find appointments for this doctor sort by date desc
        const appointments = await Appointment.find({ doctorId: req.user.id })
            .populate('patientId')
            .sort({ date: -1 });

        // Extract unique patients with their latest appointment ID
        const patientsMap = new Map();

        appointments.forEach(appt => {
            if (appt.patientId) {
                const patId = appt.patientId._id.toString();
                if (!patientsMap.has(patId)) {
                    // First time we see this patient (since we sorted desc, this is the latest)
                    const patientData = appt.patientId.toObject();
                    patientData.latestAppointmentId = appt._id;
                    patientsMap.set(patId, patientData);
                }
            }
        });

        const patients = Array.from(patientsMap.values());

        res.render('pages/patients_list', { patients, user: req.user, title: 'My Patients' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get Prescriptions
exports.getPrescriptions = async (req, res) => {
    try {
        const Prescription = require('../models/Prescription');
        const prescriptions = await Prescription.find({ patientId: req.user.id })
            .populate('doctorId', 'fullName profilePic speciality')
            .sort({ date: -1 });

        // Transform for view if needed
        const viewPrescriptions = prescriptions.map(p => ({
            ...p._doc,
            doctorName: p.doctorId ? p.doctorId.fullName : 'Unknown Doctor',
            doctorPic: p.doctorId ? p.doctorId.profilePic : null,
            doctorSpeciality: p.doctorId ? p.doctorId.speciality : 'General Physician'
        }));

        res.render('pages/prescriptions', {
            prescriptions: viewPrescriptions,
            user: req.user,
            title: 'My Prescriptions'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get Health Track (Vitals)
exports.getHealthTrack = async (req, res) => {
    try {
        const HealthTrack = require('../models/HealthTrack');
        // Sort by recordedAt descending
        const rawVitals = await HealthTrack.find({ patientId: req.user.id }).sort({ recordedAt: -1 });

        // Helper to format date key (e.g., YYYY-MM-DD HH:mm) for grouping matches close in time
        // Or strictly by the batch timestamp we just added
        const groupedMap = new Map();

        rawVitals.forEach(v => {
            // Group by full ISO string if they were inserted in batch they share exact time
            // Or use toLocaleDateString if we want daily grouping. 
            // The design shows "Date" column. If a user logs morning and evening, they might want separate rows?
            // Let's use exact time for now as it maps to "updates".
            const k = v.recordedAt ? v.recordedAt.toString() : 'Unknown Date';

            if (!groupedMap.has(k)) {
                groupedMap.set(k, { date: v.recordedAt, heart_rate: '-', bp: '-', weight: '-' });
            }
            const entry = groupedMap.get(k);
            if (v.type === 'heart_rate') entry.heart_rate = v.value;
            if (v.type === 'blood_pressure') entry.bp = v.value;
            if (v.type === 'weight') entry.weight = v.value;
        });

        const groupedVitals = Array.from(groupedMap.values());

        res.render('pages/vitals', {
            vitals: rawVitals, // Keep raw for Charts
            groupedVitals,     // Processed for Table
            user: req.user,
            title: 'Health Progress'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Add Health Track Entry
exports.addHealthTrack = async (req, res) => {
    try {
        const HealthTrack = require('../models/HealthTrack');
        const { heart_rate, bp_sys, bp_dia, weight } = req.body;

        const timestamp = new Date(); // Use same timestamp for batch
        const operations = [];

        if (heart_rate) {
            operations.push({
                patientId: req.user.id,
                type: 'heart_rate',
                value: heart_rate,
                recordedAt: timestamp
            });
        }

        if (bp_sys && bp_dia) {
            operations.push({
                patientId: req.user.id,
                type: 'blood_pressure',
                value: `${bp_sys}/${bp_dia}`,
                recordedAt: timestamp
            });
        }

        if (weight) {
            operations.push({
                patientId: req.user.id,
                type: 'weight',
                value: weight,
                recordedAt: timestamp
            });
        }

        if (operations.length > 0) {
            await HealthTrack.insertMany(operations);
            req.flash('success_msg', 'Vitals recorded successfully');
        } else {
            req.flash('error_msg', 'No data entered');
        }

        res.redirect('/health-track');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error recording vitals');
        res.redirect('/health-track');
    }
};

// Get Messages
exports.getMessages = async (req, res) => {
    try {
        // Placeholder for now
        res.render('pages/messages', { user: req.user, title: 'Messages' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get Reports
exports.getReports = async (req, res) => {
    try {
        const Report = require('../models/Report');
        // If Report model exists, fetch. Else empty array.
        let reports = [];
        try {
            reports = await Report.find({ patientId: req.user.id }).sort({ date: -1 });
        } catch (e) { console.log('Report model issue or dry run', e); }

        res.render('pages/reports', { reports, user: req.user, title: 'Medical Reports' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Video Call Page
exports.getVideoCall = async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        const appointmentId = req.params.id;

        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'fullName')
            .populate('doctorId', 'fullName');

        if (!appointment) {
            req.flash('error_msg', 'Appointment not found');
            return res.redirect('/dashboard');
        }

        // Authorization Check
        if (appointment.patientId._id.toString() !== req.user.id && appointment.doctorId._id.toString() !== req.user.id) {
            req.flash('error_msg', 'Unauthorized access to this meeting');
            return res.redirect('/dashboard');
        }

        res.render('pages/video_call', {
            appointment,
            user: req.user,
            title: 'Video Consultation',
            zegocloud: {
                appID: 396375826,
                serverSecret: '7f00aecf800200de1b51c9391a4677d6'
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
