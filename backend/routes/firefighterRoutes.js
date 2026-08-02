const express = require('express');
const { getFirefighters, updateFirefighter } = require('../controllers/firefighterController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getFirefighters);
router.patch('/:id', authenticate, authorize('Admin', 'Dispatcher', 'Firefighter'), updateFirefighter);

module.exports = router;
