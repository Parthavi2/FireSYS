const express = require('express');
const { getStations, createStation, updateStation, deleteStation } = require('../controllers/stationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getStations);
router.post('/', authenticate, authorize('Admin'), createStation);
router.put('/:id', authenticate, authorize('Admin'), updateStation);
router.delete('/:id', authenticate, authorize('Admin'), deleteStation);

module.exports = router;
