const asyncHandler = require("../utils/asyncHandler");
const { receivePurchaseOrder } = require("../services/purchaseOrder.service");
const PurchaseOrder = require("../models/PurchaseOrder");

exports.receivePO = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { purchaseOrderId, receivedItems } = req.body;

  if (!receivedItems || !receivedItems.length) {
    return res.status(400).json({ message: "No items provided" });
  }

  const po = await receivePurchaseOrder(tenantId, purchaseOrderId, receivedItems, req.app);
  res.json(po);
});

exports.getPurchaseOrders = asyncHandler(async (req, res) => {    
  const tenantId = req.user.tenantId;

  const purchaseOrders = await PurchaseOrder
    .find({ tenantId })
    .populate("supplierId", "name")
    .populate("items.variantId", "name sku")
    .sort({ createdAt: -1 });

  res.json(purchaseOrders);
});
