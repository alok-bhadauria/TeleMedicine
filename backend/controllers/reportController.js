const Report = require('../models/Report');

const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// Helper to generate signed URL
const getSignedUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    try {
        const split = url.split('/upload/');
        if (split.length < 2) return url;
        let afterUpload = split[1];
        const parts = afterUpload.split('/');
        if (parts[0].startsWith('v') && !isNaN(parseInt(parts[0].substring(1)))) {
            parts.shift();
        }
        const publicId = parts.join('/');
        const resourceType = url.includes('/raw/') ? 'raw' : 'image';
        return cloudinary.url(publicId, {
            resource_type: resourceType,
            type: 'upload',
            sign_url: true,
            secure: true
        });
    } catch (e) {
        console.error("Error signing URL:", e);
        return url;
    }
};

// Get All Reports for User
exports.getReports = async (req, res) => {
    try {
        let reports = await Report.find({ patientId: req.user.id }).sort({ uploadedAt: -1 });

        // Sign URLs
        reports = reports.map(r => {
            const rObj = r.toObject();
            rObj.fileUrl = getSignedUrl(rObj.fileUrl);
            return rObj;
        });

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
