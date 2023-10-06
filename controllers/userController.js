const executeSQL = require('../middleware/executeSQL');



// Store user info web interface
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