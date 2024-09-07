const express = require("express");
const router = express.Router();

const usersController = require("../../controllers/usersController");
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");

router
  .route("/")
  .get(verifyJWT(true), verifyRoles("Admin"), usersController.getAllUsers);

router.route("/:id/username").get(usersController.getUsername);

router.use(verifyJWT(true));
router
  .route("/:id")
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = router;
