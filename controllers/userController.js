const executeSQL = require('../middleware/executeSQL');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Store user from the android app info web interface
exports.storeUser = async (req, res) => {

    const { FirstName, LastName, CurrentDeviceID } = req.body;
    const sql = "INSERT INTO androidappusers (FirstName, LastName, CurrentDeviceID) VALUES (?, ?, ?)";
    try {
      await executeSQL(sql, [FirstName, LastName, CurrentDeviceID]);
      res.status(200).json({ message: "User info stored successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };


  exports.addWebUser = async (req, res) => {
    try {
      const { username, password, email, isAdmin } = req.body;
  
      // Check if username or email already exists
      const checkQuery = 'SELECT * FROM WebPageUsers WHERE Username = ? OR Email = ?';
      const existingUsers = await executeSQL(checkQuery, [username, email]);
      if (existingUsers.length > 0) {
        return res.status(409).send({ success: false, message: 'Username or email already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Insert into WebPageUsers
      const insertQuery = 'INSERT INTO WebPageUsers (Username, Password, Email, IsAdmin) VALUES (?, ?, ?, ?)';
      await executeSQL(insertQuery, [username, hashedPassword, email, isAdmin]);
  
      res.send({ success: true, message: 'Web user added successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: 'An error occurred while adding the web user' });
    }
  };
  
  
  exports.addAppUser = async (req, res) => {
    try {
      const { firstName, lastName, username, password } = req.body;
  
      // Check if username already exists
      const checkQuery = 'SELECT * FROM AndroidAppUsers WHERE Username = ?';
      const existingUsers = await executeSQL(checkQuery, [username]);
      if (existingUsers.length > 0) {
        return res.status(409).send({ success: false, message: 'Username already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Insert into AndroidAppUsers
      const insertQuery = 'INSERT INTO AndroidAppUsers (FirstName, LastName, Username, Password) VALUES (?, ?, ?, ?)';
      await executeSQL(insertQuery, [firstName, lastName, username, hashedPassword]);
  
      res.send({ success: true, message: 'App user added successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: 'An error occurred while adding the app user' });
    }
  };
  