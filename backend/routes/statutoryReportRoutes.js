const express = require("express");
const router = express.Router();

const {
  getPFReport,
  getESIReport,
  getPTReport,
  getComplianceSummary,
} = require("../controllers/statutoryReportController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

router.use(protect);

// Only Admin / Finance can access statutory reports
router.get("/pf", authorize("superadmin", "admin", "finance"), getPFReport);
router.get("/esi", authorize("superadmin", "admin", "finance"), getESIReport);
router.get("/pt", authorize("superadmin", "admin", "finance"), getPTReport);
router.get("/summary", authorize("superadmin", "admin", "finance"), getComplianceSummary);


const {
  downloadPFReport,
  downloadESIReport,
  downloadPTReport,
  downloadComplianceSummary,
} = require("../controllers/statutoryReportController");

// PDF routes
router.get("/pf/download", authorize("superadmin", "admin", "finance"), downloadPFReport);
router.get("/esi/download", authorize("superadmin", "admin", "finance"), downloadESIReport);
router.get("/pt/download", authorize("superadmin", "admin", "finance"), downloadPTReport);
router.get("/summary/download", authorize("superadmin", "admin", "finance"), downloadComplianceSummary);

module.exports = router;