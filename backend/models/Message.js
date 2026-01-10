const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    senderId: { type: String, ref: 'User', required: true },
    receiverId: { type: String, ref: 'User', required: true },
    content: { type: String, required: true },
    attachment: { type: String, ref: 'Report' }, // storing Report ID
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', MessageSchema);
