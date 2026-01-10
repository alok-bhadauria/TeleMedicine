const Report = require('../models/Report');
const User = require('../models/User');

// Get All Reports for User
exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find({ patientId: req.user.id }).sort({ uploadedAt: -1 });
        res.render('pages/reports', {
            title: 'Medical Reports',
            user: req.user,
            reports: reports
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Upload Report
exports.uploadReport = async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error_msg', 'Please upload a file');
            return res.redirect('/reports');
        }

        const { title, type } = req.body; // type from enum

        const newReport = new Report({
            patientId: req.user.id,
            title: title || req.file.originalname,
            fileUrl: req.file.path,
            fileType: type || 'other',
            mimeType: req.file.mimetype // Helper for frontend rendering (img vs pdf)
        });

        await newReport.save();
        req.flash('success_msg', 'Report uploaded successfully');
        res.redirect('/reports');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error uploading report');
        res.redirect('/reports');
    }
};

// Delete Report
exports.deleteReport = async (req, res) => {
    try {
        const reportId = req.params.id;
        const report = await Report.findById(reportId);

        if (!report) {
            req.flash('error_msg', 'Report not found');
            return res.redirect('/reports');
        }

        // Check ownership
        if (report.patientId !== req.user.id) {
            req.flash('error_msg', 'Unauthorized');
            return res.redirect('/reports');
        }

        await Report.findByIdAndDelete(reportId);
        // Optional: Delete from Cloudinary using public_id if needed, but for now just DB

        req.flash('success_msg', 'Report deleted');
        res.redirect('/reports');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting report');
        res.redirect('/reports');
    }
};
