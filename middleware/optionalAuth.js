// middleware/optionalAuth.js
const jwt = require("jsonwebtoken");

const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null; // 👈 important
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null; // 👈 token invalid, still continue
      return next();
    }

    req.user = user;
    next();
  });
};

module.exports = optionalAuthenticateToken;
