const express = require("express");
const router = express.Router();

const {
  generatePayslip,
  getAllPayslips,
  getPayslip,
  getMyPayslips
} = require("../controllers/payslipController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");
const { downloadPayslipPDF } = require("../controllers/payslipController");

router.use(protect);

// Generate payslip (Admin/Payroll)
router.post("/", authorize("superadmin", "admin", "payroll_admin"), generatePayslip);

// View all payslips
router.get("/", authorize("superadmin", "admin", "payroll_admin", "finance"), getAllPayslips);

// Employee self service
router.get("/my-payslips", getMyPayslips);

// View single payslip
router.get("/:id", authorize("superadmin", "admin", "payroll_admin", "finance"), getPayslip);

router.get("/:id/download", protect, downloadPayslipPDF);

module.exports = router;