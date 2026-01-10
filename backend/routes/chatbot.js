const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { ensureAuthenticated } = require('../middleware/auth');

router.post('/ask', ensureAuthenticated, chatbotController.getChatResponse);

module.exports = router;
