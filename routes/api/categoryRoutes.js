const express = require("express");
const router = express.Router();

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
  .patch(
    verifyRoles("Admin", "Editor", "Creator"),
    categoriesController.incrementPostsCount
  )
  .delete(verifyRoles("Admin"), categoriesController.deleteCategory);
