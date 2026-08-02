const express = require('express');
const { createDispatch } = require('../controllers/dispatchController');

const router = express.Router();

router.post('/', createDispatch);

module.exports = router;
