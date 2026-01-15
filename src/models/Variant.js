const mongoose = require("mongoose");

const VariantSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },
    attributes: {
      type: Map,
      of: String,
      required: true
    },
    sku: { type: String, required: true },
    stock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10 },
    price: { type: Number, required: true }
  },
  { timestamps: true }
);

// unique SKU per tenant
VariantSchema.index({ tenantId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model("Variant", VariantSchema);
