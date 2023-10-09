const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/api/store_user', userController.storeUser);
router.post('/api/addWebUser', userController.addWebUser);  // Route for adding a web user
router.post('/api/addAppUser', userController.addAppUser);  // Route for adding an app user

module.exports = router;
