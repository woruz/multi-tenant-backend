const asyncHandler = require("../utils/asyncHandler");
const { getLowStockVariants } = require("../services/stock.service");

/**
 * GET /api/stock/low-stock
 * Returns all low-stock variants for the tenant, considering pending purchase orders
 */
exports.lowStock = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;

  const lowStockItems = await getLowStockVariants(tenantId);

  res.json({
    count: lowStockItems.length,
    lowStockItems
  });
});
