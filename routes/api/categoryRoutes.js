const express = require("express");
const router = express.Router();

const categoriesController = require("../../controllers/categoriesController");
const verifyRoles = require("../../middleware/verifyRoles");

router
  .route("/")
  .post(verifyRoles("Admin"), categoriesController.createNewCategory)
  .get(
    verifyRoles("Admin", "Editor", "Creator"),
    categoriesController.getAllCategories
  );

router
  .route("/:id")
  .patch(verifyRoles("Admin"), categoriesController.changeCategoryName)
  .delete(verifyRoles("Admin"), categoriesController.deleteCategory);

module.exports = router;
