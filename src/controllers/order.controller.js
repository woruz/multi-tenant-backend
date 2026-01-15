const asyncHandler = require("../utils/asyncHandler");
const { placeOrder } = require("../services/order.service");
const Order = require("../models/Order");

exports.createOrder = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const items = req.body.items;

  if (!items || !items.length) {
    return res.status(400).json({ message: "No items provided" });
  }

  const order = await placeOrder(tenantId, items, req.app);

  res.status(201).json(order);
});

exports.getOrders = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const orders = await Order.find({ tenantId });
  res.json(orders);
});
