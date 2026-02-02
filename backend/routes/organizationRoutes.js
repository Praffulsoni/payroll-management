const express = require("express");
const router = express.Router();

const { saveOrganization, getOrganization } = require("../controllers/organizationController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

// Only admin/superadmin can configure organization
router.post("/", protect, authorize("admin", "superadmin"), saveOrganization);
router.get("/", protect, getOrganization);

module.exports = router;
