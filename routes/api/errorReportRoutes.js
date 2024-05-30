const express = require("express");
const router = express.Router();

const errorReportController = require("../../controllers/errorReportController");
const verifyJWT = require("../../middleware/verifyJWT");
const verifyRoles = require("../../middleware/verifyRoles");

router.route("/").post(errorReportController.createErrorReport);

router.use(verifyJWT(true));
router
  .route("/")
  .get(verifyRoles("Admin"), errorReportController.getAllErrorReports);
router
  .route("/:id")
  .get(verifyRoles("Admin"), errorReportController.getErrorReport);
