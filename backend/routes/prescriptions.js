const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');

router.get('/:id', ensureAuthenticated, prescriptionController.getPrescription);
router.post('/add', ensureAuthenticated, ensureRole('doctor'), prescriptionController.createPrescription);

module.exports = router;
