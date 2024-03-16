const express = require("express");
const router = express.Router();

const postsController = require("../../controllers/postsController");
const verifyJWT = require("../../middleware/verifyJWT");
const verifyRoles = require("../../middleware/verifyRoles");

router.route("/:id/addView").patch(postsController.addPostView);

router.use(verifyJWT(true));
router.route("/").get(postsController.getAllPosts);
router.route("/:id").get(postsController.getPost);

router.use(verifyJWT(true));
router
  .route("/:id")
  .patch(verifyRoles("Admin", "Editor", "Creator"), postsController.updatePost)
  .delete(
    verifyRoles("Admin", "Editor", "Creator"),
    postsController.deletePost
  );

router
  .route("/")
  .post(
    verifyRoles("Admin", "Editor", "Creator"),
    postsController.createNewPost
  );

module.exports = router;
