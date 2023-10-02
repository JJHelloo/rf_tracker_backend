const express = require('express');
const mysql = require("mysql");
const authController = require('../controllers/authControllers');
const app = express();

app.post('/api/login', authControllers.login_post);

module.exports = app;