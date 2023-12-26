const jwt = require("jsonwebtoken");

const verifyJWT = (mustBeLoggedIn) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!mustBeLoggedIn && !authHeader?.startsWith("Bearer ")) {
      req.isLoggedIn = false;
      return next();
    }

    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err && mustBeLoggedIn) {
        return res.sendStatus(403);
      } else if (err) {
        req.isLoggedIn = false;
        return next();
      }
      req.isLoggedIn = true;
      req.username = decoded.UserInfo.username;
      req.roles = decoded.UserInfo.roles;
      next();
    });
  };
};

module.exports = verifyJWT;
