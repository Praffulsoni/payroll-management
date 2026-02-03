const express = require("express");
const router = express.Router();

const {
  getPFReport,
  getESIReport,
  getPTReport,
  getComplianceSummary,
  downloadPFReport,
  downloadESIReport,
  downloadPTReport,
  downloadComplianceSummary,
} = require("../controllers/statutoryReportController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

router.use(protect);

// View reports
router.get("/pf", authorize("superadmin", "admin", "finance"), getPFReport);
router.get("/esi", authorize("superadmin", "admin", "finance"), getESIReport);
router.get("/pt", authorize("superadmin", "admin", "finance"), getPTReport);
router.get("/summary", authorize("superadmin", "admin", "finance"), getComplianceSummary);

// Download PDF reports
router.get("/pf/download", authorize("superadmin", "admin", "finance"), downloadPFReport);
router.get("/esi/download", authorize("superadmin", "admin", "finance"), downloadESIReport);
router.get("/pt/download", authorize("superadmin", "admin", "finance"), downloadPTReport);
router.get("/summary/download", authorize("superadmin", "admin", "finance"), downloadComplianceSummary);

module.exports = router;
