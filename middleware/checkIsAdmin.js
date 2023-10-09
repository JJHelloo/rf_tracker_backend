// middleware/checkIsAdmin.js
const checkIsAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Permission denied" });
  }
  next();
};

  
  module.exports = checkIsAdmin;
  