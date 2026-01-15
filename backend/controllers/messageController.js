const User = require('../models/User');
const Message = require('../models/Message');
const cloudinary = require('cloudinary').v2;

// Helper to generate signed URL for Cloudinary assets (especially raw PDFs)
const getSignedUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;

    try {
        // Extract public_id and resource_type
        // URL format: .../resource_type/type/vVersion/folder/file
        // Example: .../raw/upload/v1234/folder/file.pdf
        const split = url.split('/upload/');
        if (split.length < 2) return url;

        let afterUpload = split[1]; // v123/folder/file.pdf or folder/file.pdf
        const parts = afterUpload.split('/');

        // Remove version if present
        if (parts[0].startsWith('v') && !isNaN(parseInt(parts[0].substring(1)))) {
            parts.shift();
        }

        const publicId = parts.join('/'); // folder/file.pdf

        // Determine resource_type from URL
        const resourceType = url.includes('/raw/') ? 'raw' : 'image';

        // Generate signed URL
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

// Render Chat Page
exports.chatPage = async (req, res) => {
    try {
        let contacts = [];
        const currentUser = req.user;

        if (currentUser.role === 'patient') {
            // Patients see all Doctors and Admins
            contacts = await User.find({ role: { $in: ['doctor', 'admin'] } })
                .select('fullName role profilePic speciality _id');

        } else if (currentUser.role === 'admin') {
            // Admin sees everyone (limited to 100 for performance)
            contacts = await User.find({ _id: { $ne: currentUser.id } })
                .select('fullName role profilePic speciality _id')
                .limit(100);

        } else if (currentUser.role === 'doctor') {
            // Doctors see other Doctors + Admins
            const colleagues = await User.find({
                role: { $in: ['doctor', 'admin'] },
                _id: { $ne: currentUser.id }
            }).select('fullName role profilePic speciality _id');

            // AND Patients they have treated (from Appointments)
            const Appointment = require('../models/Appointment');

            // Find unique patientIds from appointments where this doctor is the provider
            const patientIds = await Appointment.find({ doctorId: currentUser.id }).distinct('patientId');

            // Also find patients who have messaged this doctor (to cover cases without appointment)
            const messagedIds = await Message.distinct('senderId', { receiverId: currentUser.id });

            // Merge unique IDs
            const allPatientIds = [...new Set([...patientIds, ...messagedIds])];

            const patients = await User.find({ _id: { $in: allPatientIds } })
                .select('fullName role profilePic _id');

            contacts = [...colleagues, ...patients];
        }

        // Calculate Unread Counts
        // Use JSON conversion to avoid modifying mongoose docs directly if they are frozen
        contacts = contacts.map(c => c.toObject());

        for (let contact of contacts) {
            const unreadCount = await Message.countDocuments({
                senderId: contact._id,
                receiverId: currentUser.id,
                read: false
            });
            contact.unread = unreadCount;
        }



        // Fetch User's Reports for Attachment
        let myReports = [];
        if (req.user.role === 'patient') {
            const Report = require('../models/Report');
            myReports = await Report.find({ patientId: req.user.id }).sort({ uploadedAt: -1 });
            // Sign URLs for reports
            myReports = myReports.map(r => {
                const rObj = r.toObject();
                rObj.fileUrl = getSignedUrl(rObj.fileUrl);
                return rObj;
            });
        }

        res.render('pages/messages', {
            user: req.user,
            contacts,
            reports: myReports,
            title: 'Messages'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Search Users
exports.searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        let conditions = [{ fullName: { $regex: query, $options: 'i' } }];

        // If query looks like a custom ID (e.g., PAT..., DOC..., or just checking string match)
        // Since we are using custom String IDs (_id: "PAT123"), we can just regex search the ID too.
        conditions.push({ _id: { $regex: query, $options: 'i' } });

        const users = await User.find({
            $or: conditions
        }).select('fullName role profilePic speciality _id').limit(20);

        // Filter out self
        const results = users.filter(u => u._id.toString() !== req.user.id);

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Search failed' });
    }
};

// Get Messages with specific user
exports.getMessages = async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user.id;

        const messages = await Message.find({
            $or: [
                { senderId: req.user.id, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: req.user.id }
            ]
        }).sort({ timestamp: 1 }).populate('attachment');

        // Sign attachment URLs
        const messagesWithSignedUrls = messages.map(m => {
            const mObj = m.toObject();
            if (mObj.attachment && mObj.attachment.fileUrl) {
                mObj.attachment.fileUrl = getSignedUrl(mObj.attachment.fileUrl);
            }
            return mObj;
        });

        // Mark messages from this user as read
        await Message.updateMany(
            { senderId: otherUserId, receiverId: currentUserId, read: false },
            { $set: { read: true } }
        );

        res.json(messagesWithSignedUrls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch messages' });
    }
};

// Send Message (Persistence) - Socket handles real-time, this saves to DB
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content, attachmentId } = req.body;
        const newMessage = new Message({
            senderId: req.user.id,
            receiverId,
            content,
            attachment: attachmentId || null
        });
        await newMessage.save();
        await newMessage.populate('attachment'); // Populate for immediate return

        const msgObj = newMessage.toObject();
        if (msgObj.attachment && msgObj.attachment.fileUrl) {
            msgObj.attachment.fileUrl = getSignedUrl(msgObj.attachment.fileUrl);
        }

        res.json({ success: true, message: msgObj });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send' });
    }
};

// Get Unread Count & Recent Notifications
exports.getUnread = async (req, res) => {
    try {
        const userId = req.user.id;
        const totalUnread = await Message.countDocuments({ receiverId: userId, read: false });

        const recentMessages = await Message.find({ receiverId: userId, read: false })
            .sort({ timestamp: -1 })
            .limit(5)
            .populate('senderId', 'fullName profilePic role');

        res.json({ count: totalUnread, messages: recentMessages });
    } catch (err) {
        console.error(err);
        res.json({ count: 0, messages: [] });
    }
};
