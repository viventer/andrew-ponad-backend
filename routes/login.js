const express = require("express");
const router = express.Router();

const loginController = require("../controllers/loginController");
const loginLimiter = require("../middleware/loginLimiter");

router.route("/").post(loginLimiter, loginController.handleLogin);

module.exports = router;
