const express = require('express');
const { getUsers, createUser, updateUser, deactivateUser } = require('../controllers/userAdminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('Admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deactivateUser);

module.exports = router;
