const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    country: {
      type: String,
      default: "India",
    },
    state: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);