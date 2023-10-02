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

  // console.log("Data:", data);  // Debugging line
  // console.log("Password:", password); // Debugging line

  if (data.length > 0) {
    const passwordHash = data[0].Password;
    // console.log("Password Hash:", passwordHash); // Debugging line
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
// Handle login for users
app.post("/login", async (req, res) => {
  try {
    const { username, password, MACAddress, SerialNumber } = req.body; // Get MACAddress and SerialNumber
    console.log(req.body);
    if (await checkUserCredentials(username, password)) {
      const token = jwt.sign(
        { username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      ); 

      // First, find the DeviceID based on the MACAddress and SerialNumber
      const sqlFindDevice = `SELECT DeviceID FROM RFDevices WHERE MACAddress = ? AND SerialNumber = ?`;
      const deviceData = await executeSQL(sqlFindDevice, [MACAddress, SerialNumber]);

      if (deviceData.length > 0) {
        const deviceID = deviceData[0].DeviceID;

        // Update the CurrentDeviceID in the AndroidAppUsers table
        const sqlUpdateDevice = `UPDATE AndroidAppUsers SET CurrentDeviceID = ? WHERE Username = ?`;
        await executeSQL(sqlUpdateDevice, [deviceID, username]);
      } else {
        // You might want to handle the case where the device is not found in your database
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


// Endpoint to receive location data
app.post('/api/location', async (req, res) => {
  try {
    console.log(req.body);
    const { latitude, longitude, username } = req.body;
    // console.log(username);
    if (!latitude || !longitude || !username) {
      return res.status(400).send({ error: "Missing required fields" });
    }

    // Assuming you have a way to get deviceID based on username, MAC address, or another identifier
    // For example, you could run a SQL query to get it
    // const deviceID = /* SQL query or other method to get device ID based on username or another identifier */;

    // SQL queries to update device information in the database
    const sqlUpdateRFDevice = "UPDATE RFDevices SET CurrentLocation = ? WHERE DeviceID = ?";
    const sqlInsertDeviceHistory = "INSERT INTO DeviceHistory (DeviceID, Location) VALUES (?, ?)";
    
    // Execute the SQL queries
    await executeSQL(sqlUpdateRFDevice, [`${latitude}, ${longitude}`, deviceID]);
    await executeSQL(sqlInsertDeviceHistory, [deviceID, `${latitude}, ${longitude}`]);

    console.log(`Received location: ${latitude}, ${longitude} from ${username}`);

    res.status(200).json({
      message: 'Location data received',
      latitude: latitude,
      longitude: longitude
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "An error occurred while processing your request." });
  }
});


// Store device info
app.post('/api/store_device', async (req, res) => {
  console.log("device activated");
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
  console.log("user activated");

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
