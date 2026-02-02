const mongoose = require("mongoose");

const taxDeclarationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    financialYear: {
      type: String, // e.g. "2025-2026"
      required: true
    },

    regime: {
      type: String,
      enum: ["old", "new"],
      default: "new"
    },

    totalInvestmentAmount: {
      type: Number,
      default: 0
    },

    proofs: [
      {
        name: String,
        documentUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft"
    },

    remarks: {
      type: String
    }
  },
  { timestamps: true }
);

taxDeclarationSchema.index({ employee: 1, financialYear: 1 }, { unique: true });

module.exports = mongoose.model("TaxDeclaration", taxDeclarationSchema);