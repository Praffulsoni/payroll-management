const express = require("express");
const router = express.Router();

const {
  createSalaryStructure,
  getSalaryStructures,
  getSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
} = require("../controllers/salaryStructureController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

// Only HR/Admin can manage salary structures
router.use(protect);

router.post("/", authorize("superadmin", "admin", "hr_admin"), createSalaryStructure);
router.get("/", authorize("superadmin", "admin", "hr_admin", "payroll_admin"), getSalaryStructures);
router.get("/:id", authorize("superadmin", "admin", "hr_admin", "payroll_admin"), getSalaryStructure);
router.put("/:id", authorize("superadmin", "admin", "hr_admin"), updateSalaryStructure);
router.delete("/:id", authorize("superadmin", "admin", "hr_admin"), deleteSalaryStructure);

module.exports = router;
