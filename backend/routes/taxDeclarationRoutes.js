const express = require("express");
const router = express.Router();

const {
  saveTaxDeclaration,
  getMyTaxDeclarations,
  getAllTaxDeclarations,
  reviewTaxDeclaration
} = require("../controllers/taxDeclarationController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

router.use(protect);

// Employee submits declaration
router.post("/", authorize("employee"), saveTaxDeclaration);
router.get("/my", authorize("employee"), getMyTaxDeclarations);

// HR/Finance views and reviews
router.get("/", authorize("admin", "hr_admin", "finance"), getAllTaxDeclarations);
router.put("/:id/review", authorize("admin", "hr_admin", "finance"), reviewTaxDeclaration);

module.exports = router;
