const jwt = require('jsonwebtoken');


// check user auth or not
module.exports =  function isLoggedIn(req, res, next) {
    if (req.session.authenticated) {
      next();
    } else {
      res.redirect("/signIn");
    }
}