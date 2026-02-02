const mongoose = require("mongoose");

const statutorySchema = new mongoose.Schema(
  {
    country: {
      type: String,
      default: "India",
    },
    state: {
      type: String,
    },
    pfPercentage: {
      type: Number,
      default: 12,
    },
    esiPercentage: {
      type: Number,
      default: 1.75,
    },
    professionalTax: {
      type: Number,
      default: 200,
    },
    taxSlab: {
      type: Number, // simple slab percentage for now
      default: 10,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Statutory", statutorySchema);