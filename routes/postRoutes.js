const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router
  .route("/")
  .get(postsController.getAllPosts)
  .post(postsController.createNewPost)
  .patch(postsController.updatePost)
  .delete(postsController.deletePost);

module.exports = router;
