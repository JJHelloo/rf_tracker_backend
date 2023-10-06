const executeSQL = require('../middleware/executeSQL');

exports.storeBoundary = async function(req, res) {
    const { BoundaryName, BoundaryCoordinates } = req.body;
    const sql = "INSERT INTO GeofenceBoundaries (BoundaryName, BoundaryCoordinates) VALUES (?, ?)";
    try {
      await executeSQL(sql, [BoundaryName, BoundaryCoordinates]);
      res.status(200).json({ message: "Geofence boundary stored successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};