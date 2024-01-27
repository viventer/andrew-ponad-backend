const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req?.roles) return res.json({ message: "roles error" }).status(401);

    const rolesArray = [...allowedRoles];

    const result = req.roles
      .map((role) => rolesArray.includes(role))
      .find((value) => value === true);

    if (!result) return res.status(401).json({ message: "verify roles error" });
    next();
  };
};

module.exports = verifyRoles;
