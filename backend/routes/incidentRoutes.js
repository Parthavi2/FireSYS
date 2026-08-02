const express = require('express');
const { getIncidents, createIncident } = require('../controllers/incidentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getIncidents);
router.post('/', authenticate, authorize('Admin', 'Dispatcher'), createIncident);

module.exports = router;
