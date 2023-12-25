const express = require("express");
const router = express.Router();
const usersController = require("../../controllers/usersController");
const verifyRoles = require("../../middleware/verifyRoles");

router.route("/").get(verifyRoles("Admin"), usersController.getAllUsers);

router
  .route("/:id")
  .get(usersController.getUser)
  .patch(verifyRoles("Admin"), usersController.updateUser)
  .delete(verifyRoles("Admin"), usersController.deleteUser);

module.exports = router;
