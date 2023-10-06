const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.post('/api/associateUserWithDevice', deviceController.associateUserWithDevice);
router.post('/api/location', deviceController.location);
router.post('/api/store_device', deviceController.storeDevice);
router.get('/api/devices', deviceController.getDevices);
router.get('/api/device/location/:id', deviceController.getDeviceLocation);

module.exports = router;
