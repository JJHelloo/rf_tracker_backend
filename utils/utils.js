const executeSQL = require('../middleware/executeSQL');  // Assuming executeSQL is in middleware folder
const bcrypt = require('bcrypt');
const pool = require("../config/databaseConfig.js");
const jwt = require('jsonwebtoken');


  
  async function getDeviceIdFromToken(token) {
    // Decode the token to get the payload
    const decoded = jwt.decode(token);
  
    // Assume the decoded token contains a SerialNumber
    const serialNumber = decoded.SerialNumber;
  
    // Query the database to get the DeviceID associated with this SerialNumber
    const sql = "SELECT DeviceID FROM RFDevices WHERE SerialNumber = ?";
    const result = await executeSQL(sql, [serialNumber]);
  
    if (result && result.length > 0) {
      return result[0].DeviceID;
    } else {
      return null;
    }
  }

// Function to check user credentials from the database
async function checkUserCredentials(username, password) {
    const sql = `SELECT * FROM androidappusers WHERE Username = ?`;
    const data = await executeSQL(sql, [username]);
  
    if (data.length > 0) {
      const passwordHash = data[0].Password;
      if(password && passwordHash) {
          return await bcrypt.compare(password, passwordHash);
      } else {
          console.log("Either password or passwordHash is missing.");
          return false;
      }
    }
    console.log("User not found.");
    return false;
  }
  async function checkWebUserCredentials(username, password) {
    const sql = `SELECT * FROM webpageusers WHERE Username = ?`;
    const data = await executeSQL(sql, [username]);
  
    if (data.length > 0) {
      const passwordHash = data[0].Password;
      const isAdmin = data[0].IsAdmin;  // Retrieve the IsAdmin flag from the database record
      const isValid = password && passwordHash ? await bcrypt.compare(password, passwordHash) : false;
  
      // Return both the validity of the login and the admin status
      return { isValid, isAdmin };
    }
    return { isValid: false, isAdmin: false };
  }
  
  module.exports = { checkUserCredentials, getDeviceIdFromToken, checkWebUserCredentials };
  