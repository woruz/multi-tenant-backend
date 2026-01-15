const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    skuPrefix: String, // optional, can help generate variant SKUs
    category: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
