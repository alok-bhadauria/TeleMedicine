const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ensureAuthenticated, ensureRole('patient'), reportController.getReports);
router.post('/upload', ensureAuthenticated, ensureRole('patient'), upload.single('reportFile'), reportController.uploadReport);
router.post('/delete/:id', ensureAuthenticated, ensureRole('patient'), reportController.deleteReport);

module.exports = router;
