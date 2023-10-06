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


// Import routes
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const userRoutes = require('./routes/userRoutes');
const geofenceRoutes = require('./routes/geofenceRoutes');

// Use routes
app.use('/auth', authRoutes);
app.use('/devices', deviceRoutes);
app.use('/users', userRoutes);
app.use('/geofence', geofenceRoutes);


app.listen(PORT, () => {
  console.log("Server Started");
});