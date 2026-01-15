const Variant = require("../models/Variant");
const Order = require("../models/Order");
const StockMovement = require("../models/StockMovement");
const { getLowStockVariants } = require("./stock.service");

/**
 * Get dashboard metrics for a tenant
 */
async function getDashboard(tenantId) {
  // 1. Low stock (reuse optimized service)
  const lowStockPromise = getLowStockVariants(tenantId);

  // 2. Top 5 sellers (last 30 days)
  const topSellersPromise = Order.aggregate([
    {
      $match: {
        tenantId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // last 30 days
      }
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.variantId",
        totalSold: { $sum: "$items.quantity" }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "variants",
        localField: "_id",
        foreignField: "_id",
        as: "variant"
      }
    },
    { $unwind: "$variant" },
    {
      $project: {
        _id: 0,
        variantId: "$variant._id",
        sku: "$variant.sku",
        attributes: "$variant.attributes",
        totalSold: 1
      }
    }
  ]);

  // 3. Stock movement (last 7 days)
  const stockMovementPromise = StockMovement.aggregate([
    {
      $match: {
        tenantId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          type: "$type"
        },
        totalQty: { $sum: "$quantity" }
      }
    },
    {
      $group: {
        _id: "$_id.day",
        movements: {
          $push: { type: "$_id.type", totalQty: "$totalQty" }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 4. Inventory value (total stock * price)
  const inventoryValuePromise = Variant.aggregate([
    { $match: { tenantId } },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ["$stock", "$price"] } }
      }
    }
  ]);

  const [lowStock, topSellers, stockMovements, inventoryValue] = await Promise.all([
    lowStockPromise,
    topSellersPromise,
    stockMovementPromise,
    inventoryValuePromise
  ]);

  return {
    lowStock,
    topSellers,
    stockMovements,
    inventoryValue: inventoryValue.length ? inventoryValue[0].totalValue : 0
  };
}

module.exports = { getDashboard };
