const mongoose = require("mongoose");
const Variant = require("../models/Variant");
const StockMovement = require("../models/StockMovement");
const PurchaseOrder = require("../models/PurchaseOrder");

// async function receivePurchaseOrder(tenantId, purchaseOrderId, receivedItems) {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const po = await PurchaseOrder.findOne({ _id: purchaseOrderId, tenantId }).session(session);
//     if (!po) throw new Error("Purchase Order not found");
//     if (po.status === "RECEIVED") throw new Error("PO already received");

//     for (const item of receivedItems) {
//       const poItem = po.items.find(i => i.variantId.toString() === item.variantId);
//       if (!poItem) throw new Error("Variant not found in PO");

//       const qtyToAdd = item.quantity;
//       poItem.quantityReceived += qtyToAdd;

//       // update variant stock
//       await Variant.findOneAndUpdate(
//         { _id: item.variantId, tenantId },
//         { $inc: { stock: qtyToAdd } },
//         { session }
//       );

//       // create stock movement
//       await StockMovement.create(
//         [
//           {
//             tenantId,
//             variantId: item.variantId,
//             type: "PURCHASE",
//             quantity: qtyToAdd,
//             purchaseOrderId
//           }
//         ],
//         { session }
//       );
//     }

//     // update PO status
//     if (po.items.every(i => i.quantityReceived >= i.quantityOrdered)) {
//       po.status = "RECEIVED";
//     } else {
//       po.status = "CONFIRMED";
//     }

//     await po.save({ session });

//     await session.commitTransaction();
//     return po;
//   } catch (err) {
//     await session.abortTransaction();
//     throw err;
//   } finally {
//     session.endSession();
//   }
// }  

async function receivePurchaseOrder(tenantId, purchaseOrderId, receivedItems, app) {
  const lockKey = `lock:purchaseOrder:${purchaseOrderId}`;
  const lockId = await acquireLock(redis, lockKey, 5000);

  if (!lockId) throw new Error("Purchase Order is being updated by another user");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const po = await PurchaseOrder.findOne({ _id: purchaseOrderId, tenantId }).session(session);
    if (!po) throw new Error("Purchase Order not found");
    if (po.status === "RECEIVED") throw new Error("PO already fully received");

    for (const item of receivedItems) {
      const poItem = po.items.find(i => i.variantId.toString() === item.variantId);
      if (!poItem) throw new Error("Variant not found in PO");

      const qtyToAdd = item.quantity;

      poItem.quantityReceived += qtyToAdd;

      await Variant.findOneAndUpdate(
        { _id: item.variantId, tenantId },
        { $inc: { stock: qtyToAdd } },
        { session }
      );

      await StockMovement.create(
        [
          {
            tenantId,
            variantId: item.variantId,
            type: "PURCHASE",
            quantity: qtyToAdd,
            purchaseOrderId
          }
        ],
        { session }
      );
    }

    // Update PO status
    if (po.items.every(i => i.quantityReceived >= i.quantityOrdered)) {
      po.status = "RECEIVED";
    } else {
      po.status = "CONFIRMED";
    }

    await po.save({ session });
    await session.commitTransaction();

    // 🔔 Emit Socket.io event
    const io = app.get("io");
    if (io) {
      io.emit(`stockUpdated:${tenantId}`, {
        variantIds: receivedItems.map(i => i.variantId),
        type: "PO_RECEIVED"
      });
    }

    return po;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
    await releaseLock(redis, lockKey, lockId);
  }
}

module.exports = { receivePurchaseOrder };


// module.exports = { receivePurchaseOrder };
