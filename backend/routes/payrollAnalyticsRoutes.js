const express = require("express");
const router = express.Router();

const {
  getPayrollSummary,
  getDepartmentWisePayroll,
  getCTCAnalysis,
} = require("../controllers/payrollAnalyticsController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

router.use(protect);

router.get("/summary", authorize("superadmin", "admin", "finance", "payroll_admin"), getPayrollSummary);
router.get("/department-wise", authorize("superadmin", "admin", "finance", "payroll_admin"), getDepartmentWisePayroll);
router.get("/ctc", authorize("superadmin", "admin", "finance"), getCTCAnalysis);

module.exports = router;
