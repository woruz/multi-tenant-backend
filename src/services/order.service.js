const mongoose = require("mongoose");
const { redis } = require("../config");
const { acquireLock, releaseLock } = require("../utils/redisLock");

const Variant = require("../models/Variant");
const StockMovement = require("../models/StockMovement");
const Order = require("../models/Order");

async function placeOrder(tenantId, items) {
  // items = [{ variantId, quantity }, ...]
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const locks = [];

    // Acquire Redis locks for all variants
    for (const item of items) {
      const lockKey = `lock:variant:${item.variantId}`;
      const lockId = await acquireLock(redis, lockKey);
      if (!lockId) throw new Error(`Variant ${item.variantId} is busy`);
      locks.push({ key: lockKey, id: lockId });
    }

    const orderItems = [];

    // Check stock and update
    for (const item of items) {
      const variant = await Variant.findOneAndUpdate(
        {
          _id: item.variantId,
          tenantId,
          stock: { $gte: item.quantity }
        },
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );

      if (!variant) {
        throw new Error(`Insufficient stock for variant ${item.variantId}`);
      }

      // Record stock movement
      await StockMovement.create(
        [
          {
            tenantId,
            variantId: variant._id,
            type: "SALE",
            quantity: -item.quantity
          }
        ],
        { session }
      );

      orderItems.push({
        variantId: variant._id,
        quantity: item.quantity,
        price: variant.price
      });
    }

    // Create the order
    const order = await Order.create(
      [
        {
          tenantId,
          items: orderItems,
          status: "PLACED"
        }
      ],
      { session }
    );

    await session.commitTransaction();

    const io = app.get("io");
    if (io) {
      io.emit(`stockUpdated:${tenantId}`, {
        variantIds: items.map(i => i.variantId),
        type: "ORDER_PLACED"
      });
    }

    return order[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
    // Release all Redis locks
    for (const lock of locks || []) {
      await releaseLock(redis, lock.key, lock.id);
    }
  }
}

module.exports = { placeOrder };
