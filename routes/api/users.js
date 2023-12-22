const express = require("express");
const router = express.Router();
const usersController = require("../../controllers/usersController");
const verifyRoles = require("../../middleware/verifyRoles");

router
  .route("/")
  .get(verifyRoles("Admin"), usersController.getAllUsers)
  .delete(verifyRoles("Admin"), usersController.deleteUser);

router.route("/:id").get(usersController.getUser);

module.exports = router;
