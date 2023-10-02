require('dotenv').config(); 

const express = require('express');
const app = express();
const pool = require("./dbPool.js");
const fetch = require("node-fetch");
const jwt = require('jsonwebtoken');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3001;

app.set("view engine", "ejs");
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());

app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));


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

  
// Handle login for users
app.post("/login", async (req, res) => {
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
});



// set user to the device they are using
app.post('/api/associateUserWithDevice', async (req, res) => {
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
});


// Endpoint to receive location data
app.post('/api/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
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

      const sqlUpdateRFDevice = "UPDATE RFDevices SET CurrentLocation = ? WHERE DeviceID = ?";
      const sqlInsertDeviceHistory = "INSERT INTO DeviceHistory (DeviceID, Location) VALUES (?, ?)";

      await executeSQL(sqlUpdateRFDevice, [`${latitude}, ${longitude}`, deviceID]);
      await executeSQL(sqlInsertDeviceHistory, [deviceID, `${latitude}, ${longitude}`]);


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
});




// Store device info
app.post('/api/store_device', async (req, res) => {
  const { MACAddress, SerialNumber, Model, CurrentLocation, LastUser, GeofenceBoundaryID } = req.body;
  const sql = "INSERT INTO RFDevices (MACAddress, SerialNumber, Model, CurrentLocation, LastUser, GeofenceBoundaryID) VALUES (?, ?, ?, ?, ?, ?)";
  try {
    await executeSQL(sql, [MACAddress, SerialNumber, Model, CurrentLocation, LastUser, GeofenceBoundaryID]);

    res.status(200).json({ message: "Device info stored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Store user info web interface
app.post('/api/store_user', async (req, res) => {

  const { FirstName, LastName, CurrentDeviceID } = req.body;
  const sql = "INSERT INTO androidappusers (FirstName, LastName, CurrentDeviceID) VALUES (?, ?, ?)";
  try {
    await executeSQL(sql, [FirstName, LastName, CurrentDeviceID]);
    res.status(200).json({ message: "User info stored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Store geofence boundary
app.post('/api/store_boundary', async (req, res) => {
  const { BoundaryName, BoundaryCoordinates } = req.body;
  const sql = "INSERT INTO GeofenceBoundaries (BoundaryName, BoundaryCoordinates) VALUES (?, ?)";
  try {
    await executeSQL(sql, [BoundaryName, BoundaryCoordinates]);
    res.status(200).json({ message: "Geofence boundary stored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




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


// check user auth or not
function isLoggedIn(req, res, next) {
    if (req.session.authenticated) {
      next();
    } else {
      res.redirect("/signIn");
    }
}
  //sql function
async function executeSQL(sql, params) {
    return new Promise(function(resolve, reject) {
      pool.query(sql, params, function(err, rows, fields) {
        if (err) throw err;
        resolve(rows);
      });
    });
  }
  // listen to port
  app.listen(PORT, ()=>{
    console.log("Server Started");
})
