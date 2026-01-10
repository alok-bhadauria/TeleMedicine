const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { ensureAuthenticated } = require('../middleware/auth');

// Chat UI
router.get('/', ensureAuthenticated, messageController.chatPage);

// API Search Users
router.get('/search', ensureAuthenticated, messageController.searchUsers);

// API Unread Count
router.get('/unread-count', ensureAuthenticated, messageController.getUnread);

// API to get messages
router.get('/:userId', ensureAuthenticated, messageController.getMessages);

// API to send message
router.post('/send', ensureAuthenticated, messageController.sendMessage);

module.exports = router;
