const express = require('express');
const { getMaintenance, createMaintenance, updateMaintenance } = require('../controllers/maintenanceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getMaintenance);
router.post('/', authenticate, authorize('Admin'), createMaintenance);
router.patch('/:id', authenticate, authorize('Admin'), updateMaintenance);

module.exports = router;
