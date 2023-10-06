const express = require('express');
const router = express.Router();
const geofenceController = require('../controllers/geofenceController');

router.post('/api/store_boundary', geofenceController.storeBoundary);

module.exports = router;
