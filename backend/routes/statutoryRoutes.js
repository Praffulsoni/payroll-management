const express = require("express");
const router = express.Router();

const {
  saveStatutoryConfig,
  getStatutoryConfig,
} = require("../controllers/statutoryController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

// Only admin & superadmin can configure statutory rules
router.post("/", protect, authorize("admin", "superadmin"), saveStatutoryConfig);
router.get("/", protect, getStatutoryConfig);

module.exports = router;
