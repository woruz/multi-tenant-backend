const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    items: [
      {
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
      }
    ],
    status: { type: String, enum: ["PLACED", "CANCELLED", "COMPLETED"], default: "PLACED" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
