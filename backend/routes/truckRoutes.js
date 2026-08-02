const express = require('express');
const { getTrucks, createTruck, updateTruck, deleteTruck } = require('../controllers/truckController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getTrucks);
router.post('/', authenticate, authorize('Admin'), createTruck);
router.patch('/:id', authenticate, authorize('Admin', 'Dispatcher'), updateTruck);
router.delete('/:id', authenticate, authorize('Admin'), deleteTruck);

module.exports = router;
