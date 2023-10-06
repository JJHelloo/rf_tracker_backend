const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/api/store_user', userController.storeUser);

module.exports = router;
