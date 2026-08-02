const express = require('express');
const { getSummary, getMonthlyIncidents, getRecentActivity } = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('Admin', 'Dispatcher'));

router.get('/summary', getSummary);
router.get('/monthly-incidents', getMonthlyIncidents);
router.get('/activity', getRecentActivity);

module.exports = router;
