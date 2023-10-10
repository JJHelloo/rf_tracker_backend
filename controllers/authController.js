//  dependencies here
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const executeSQL = require('../middleware/executeSQL');
const { checkUserCredentials, getDeviceIdFromToken, checkWebUserCredentials } = require('../utils/utils');


// Handle login for the app users
exports.appLogin = async (req, res) => {
  console.log("log in activated");
    try {
      const { username, password, SerialNumber } = req.body; // Get SerialNumber
      console.log(req.body);
      if (await checkUserCredentials(username, password)) {
        const token = jwt.sign(
          { username, SerialNumber },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        ); 
  
        // First, find the DeviceID based on the SerialNumber
        const sqlFindDevice = `SELECT DeviceID FROM RFDevices WHERE SerialNumber = ?`;
        const deviceData = await executeSQL(sqlFindDevice, [SerialNumber]);
  
        // Find the RFUserID based on the username
        const sqlFindUser = `SELECT RFUserID FROM AndroidAppUsers WHERE Username = ?`;
        const userData = await executeSQL(sqlFindUser, [username]);
  
        if (deviceData.length > 0 && userData.length > 0) {
          const deviceID = deviceData[0].DeviceID;
          const userID = userData[0].RFUserID;
  
          // Update the CurrentDeviceID in the AndroidAppUsers table
          const sqlUpdateDevice = `UPDATE AndroidAppUsers SET CurrentDeviceID = ? WHERE Username = ?`;
          await executeSQL(sqlUpdateDevice, [deviceID, username]);
  
          // Update the LastUser in the RFDevices table
          const sqlUpdateLastUser = `UPDATE RFDevices SET LastUser = ? WHERE DeviceID = ?`;
          await executeSQL(sqlUpdateLastUser, [userID, deviceID]);
        } else {
          // Handle the case where the device or user is not found in your database
          console.log("Device or user not found in the database.");
        }
  
        res.send({
          authenticated: true,
          username: username,
          token: token,
        });
      } else {
        res.send({ error: "Invalid username or password" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "An error occurred while processing your request." });
    }
  };

  exports.webLogin = async (req, res) => {
    try {
      const { username, password } = req.body;
      const userCredentials = await checkWebUserCredentials(username, password);
  
      if (userCredentials.isValid) {
        const token = jwt.sign(
          { username, isAdmin: userCredentials.isAdmin }, // Include isAdmin flag in the token
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
  
        // No need for additional logic here, as the isAdmin flag is included in the token
        res.send({
          authenticated: true,
          username: username,
          isAdmin: userCredentials.isAdmin, // Optionally include isAdmin in the response
          token: token
        });
      } else {
        res.send({ error: "Invalid username or password" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "An error occurred while processing your request." });
    }
  };