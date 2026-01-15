const mongoose = require("mongoose");

const PurchaseOrderSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    status: {
      type: String,
      enum: ["DRAFT", "SENT", "CONFIRMED", "RECEIVED"],
      default: "DRAFT"
    },
    items: [
      {
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", required: true },
        quantityOrdered: { type: Number, required: true },
        quantityReceived: { type: Number, default: 0 },
        price: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ tenantId: 1, supplierId: 1 });

module.exports = mongoose.model("PurchaseOrder", PurchaseOrderSchema);
