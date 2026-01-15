const mongoose = require("mongoose");

const StockMovementSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true
    },
    type: {
      type: String,
      enum: ["PURCHASE", "SALE", "RETURN", "ADJUSTMENT"],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" }
  },
  { timestamps: true }
);

StockMovementSchema.index({ tenantId: 1, variantId: 1, createdAt: -1 });

module.exports = mongoose.model("StockMovement", StockMovementSchema);
