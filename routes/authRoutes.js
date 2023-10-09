const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/appLogin', authController.appLogin);
router.post('/webLogin', authController.webLogin);

module.exports = router;
