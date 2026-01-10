const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', ensureAuthenticated, reminderController.getRemindersPage);
router.get('/data', ensureAuthenticated, reminderController.getRemindersData); // New API route
router.post('/add', ensureAuthenticated, reminderController.addReminder);
router.post('/toggle/:id', ensureAuthenticated, reminderController.toggleComplete);
router.post('/delete/:id', ensureAuthenticated, reminderController.deleteReminder);

module.exports = router;
