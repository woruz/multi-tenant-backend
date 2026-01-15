const mongoose = require("mongoose");

const SupplierSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    name: { type: String, required: true },
    contactEmail: String,
    contactPhone: String,
    address: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", SupplierSchema);
