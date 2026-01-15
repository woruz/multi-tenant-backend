const Variant = require("../models/Variant");
const PurchaseOrder = require("../models/PurchaseOrder");

/**
 * Get low-stock variants for a tenant, considering pending purchase orders
 * Optimized for large datasets (10k+ products)
 */
async function getLowStockVariants(tenantId) {
  const pipeline = [
    { $match: { tenantId } },

    // Lookup pending POs for each variant
    {
      $lookup: {
        from: "purchaseorders",
        let: { variantId: "$_id" },
        pipeline: [
          { $match: { tenantId, status: { $in: ["DRAFT", "SENT", "CONFIRMED"] } } },
          { $unwind: "$items" },
          { $match: { $expr: { $eq: ["$items.variantId", "$$variantId"] } } },
          {
            $project: {
              pendingQty: { $subtract: ["$items.quantityOrdered", "$items.quantityReceived"] }
            }
          }
        ],
        as: "pendingPOs"
      }
    },

    // Sum all pending PO quantities
    {
      $addFields: {
        totalPending: { $sum: "$pendingPOs.pendingQty" },
        effectiveStock: { $add: ["$stock", { $sum: "$pendingPOs.pendingQty" }] }
      }
    },

    // Filter for low-stock
    {
      $match: { $expr: { $lt: ["$effectiveStock", "$reorderLevel"] } }
    },

    // Optional: project only needed fields
    {
      $project: {
        _id: 1,
        productId: 1,
        sku: 1,
        attributes: 1,
        stock: 1,
        reorderLevel: 1,
        effectiveStock: 1,
        totalPending: 1
      }
    }
  ];

  const lowStockVariants = await Variant.aggregate(pipeline);

  return lowStockVariants;
}

module.exports = { getLowStockVariants };
