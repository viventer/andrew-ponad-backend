const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
const verifyJWT = require("../middleware/verifyJWT");

router.route("/").get(postsController.getAllPosts);
router.route("/:id").get(postsController.getPost);

router.use(verifyJWT);

router
  .route("/:id")
  .patch(postsController.updatePost)
  .delete(postsController.deletePost);

router.route("/").post(postsController.createNewPost);

module.exports = router;
