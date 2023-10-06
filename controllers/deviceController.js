const executeSQL = require('../middleware/executeSQL');
const { getDeviceIdFromToken } = require('../utils/utils');
const jwt = require('jsonwebtoken');



exports.associateUserWithDevice = async (req, res) => {
    try {
        const { username, serialNumber } = req.body;
        
        if (!username || !serialNumber) {
            return res.status(400).send({ error: "Missing required fields" });
        }
  
        // SQL query to update AndroidAppUsers table with the DeviceID
        const sqlAssociateUser = "UPDATE AndroidAppUsers SET CurrentDeviceID = (SELECT DeviceID FROM RFDevices OR SerialNumber = ?) WHERE Username = ?";
        
        // Execute the SQL query
        await executeSQL(sqlAssociateUser, [serialNumber, username]);
  
        // console.log(`Associated user ${username} with device ${serialNumber}`);
        
        res.status(200).send({ message: 'Successfully associated user with device' });
  
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "An error occurred while processing your request." });
    }
  };
  // Store device info
  exports.storeDevice = async (req, res) => {
    const { MACAddress, SerialNumber, Model, CurrentLocation, LastUser, GeofenceBoundaryID } = req.body;
    const sql = "INSERT INTO RFDevices (MACAddress, SerialNumber, Model, CurrentLocation, LastUser, GeofenceBoundaryID) VALUES (?, ?, ?, ?, ?, ?)";
    try {
      await executeSQL(sql, [MACAddress, SerialNumber, Model, CurrentLocation, LastUser, GeofenceBoundaryID]);
  
      res.status(200).json({ message: "Device info stored successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

// Fetch all RFDevices
exports.getDevices = async (req, res) => {
    const devices = await executeSQL("SELECT * FROM RFDevices");
    res.json(devices);
  };


// Endpoint to receive location data
exports.location = async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      // console.log(req.body);
      const token = req.headers['authorization'].split(' ')[1];
  
      if (!latitude || !longitude || !token) {
        return res.status(400).send({ error: "Missing required fields or token" });
      }
  
      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(401).send({ error: "Invalid token" });
        }
  
        const deviceID = await getDeviceIdFromToken(token);
  
        if (deviceID === null) {
          return res.status(400).send({ error: "Device ID not found" });
        }
  
        // Updated SQL queries
        const sqlUpdateRFDevice = "UPDATE RFDevices SET Latitude = ?, Longitude = ? WHERE DeviceID = ?";
        const sqlInsertDeviceHistory = "INSERT INTO DeviceHistory (DeviceID, Latitude, Longitude) VALUES (?, ?, ?)";
  
  
        await executeSQL(sqlUpdateRFDevice, [latitude, longitude, deviceID]);
        await executeSQL(sqlInsertDeviceHistory, [deviceID, latitude, longitude]);
  
        res.status(200).json({
          message: 'Location data received',
          latitude: latitude,
          longitude: longitude
        });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "An error occurred while processing your request." });
    }
  };

// Fetch device location and last connected user by ID
exports.getDeviceLocation = async (req, res) => {
    const { id } = req.params;
  
    try {
      // SQL query to fetch location data and join with AndroidAppUsers to get username
      const sqlQuery = `
      SELECT 
          RFDevices.*, 
          AndroidAppUsers.Username    
          FROM 
          RFDevices 
      LEFT JOIN 
          AndroidAppUsers 
      ON 
          RFDevices.LastUser = AndroidAppUsers.RFUserID 
      WHERE 
          RFDevices.DeviceID = ?;
    `;  
      // Execute the SQL query
      const [combinedData] = await executeSQL(sqlQuery, [id]);
  
      // Send the combined data as JSON
      res.status(200).json(combinedData);
  
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "An error occurred while processing your request." });
    }
  };