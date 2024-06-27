const express = require("express");
const router = express.Router();

const categoriesController = require("../../controllers/categoriesController");
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");

router
  .route("/")
  .post(
    verifyJWT(true),
    verifyRoles("Admin"),
    categoriesController.createNewCategory
  )
  .get(categoriesController.getAllCategories);

router
  .route("/:id")
  .get(categoriesController.getCategory)
  .patch(
    verifyJWT(true),
    verifyRoles("Admin"),
    categoriesController.changeCategoryName
  )
  .delete(
    verifyJWT(true),
    verifyRoles("Admin"),
    categoriesController.deleteCategory
  );

module.exports = router;
