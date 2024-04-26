const jwt = require("jsonwebtoken");

const verifyJWT = (mustBeLoggedIn) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    const isLoggedIn = req?.headers?.islogged === "true";

    const token = authHeader?.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if ((err && isLoggedIn) || (err && mustBeLoggedIn)) {
        console.log("tutaj");
        return res.status(403).json({ errorMessage: "Błąd uprawnień" });
      } else if (err) {
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
