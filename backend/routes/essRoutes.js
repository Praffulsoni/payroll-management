const express = require("express");
const router = express.Router();
const { getDashboard } = require("../controllers/essController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/dashboard", getDashboard);

module.exports = router;
