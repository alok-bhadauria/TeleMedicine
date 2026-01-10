const express = require('express');
const router = express.Router();
const healthTrackController = require('../controllers/healthTrackController');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');

router.get('/data', ensureAuthenticated, ensureRole('patient'), healthTrackController.getVitalsData);
router.get('/', ensureAuthenticated, ensureRole('patient'), healthTrackController.getVitals);
router.post('/add', ensureAuthenticated, ensureRole('patient'), healthTrackController.addVital);

module.exports = router;
