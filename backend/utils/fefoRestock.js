"use strict";

const { Order, OrderItem, OrderItemBatch, MedicineBatch, StockLog } = require("../models");

/**
 * Kembalikan stok obat yang telah terpotong pada pesanan kembali ke kloter batch asal (FEFO)
 */
const restockOrderFefo = async ({ orderId, actorId = null, notePrefix = "Pengembalian stok", transaction = null }) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [{ model: OrderItemBatch }],
      },
    ],
    transaction,
  });

  if (!order || !order.items || order.items.length === 0) {
    return [];
  }

  const restockLogs = [];

  for (const item of order.items) {
    const allocatedBatches = item.OrderItemBatches || [];

    if (allocatedBatches.length > 0) {
      for (const alloc of allocatedBatches) {
        const batch = await MedicineBatch.findByPk(alloc.batch_id, { transaction });
        if (batch) {
          const prevStock = batch.stock;
          const nextStock = prevStock + alloc.quantity;
          await batch.update({ stock: nextStock }, { transaction });

          restockLogs.push({
            medicine_id: item.medicine_id,
            batch_id: batch.id,
            admin_id: actorId,
            activity_type: "release_reservation",
            quantity: alloc.quantity,
            stock_before: prevStock,
            stock_after: nextStock,
            notes: `${notePrefix} Pesanan #${order.id} ke kloter ${batch.batch_number}`,
          });
        }
      }
    } else {
      const fallbackBatches = await MedicineBatch.findAll({
        where: { medicine_id: item.medicine_id },
        order: [["expiry_date", "ASC"]],
        transaction,
      });

      if (fallbackBatches.length > 0) {
        const prevStock = fallbackBatches[0].stock;
        const nextStock = prevStock + item.quantity;
        await fallbackBatches[0].update({ stock: nextStock }, { transaction });

        restockLogs.push({
          medicine_id: item.medicine_id,
          batch_id: fallbackBatches[0].id,
          admin_id: actorId,
          activity_type: "release_reservation",
          quantity: item.quantity,
          stock_before: prevStock,
          stock_after: nextStock,
          notes: `${notePrefix} Pesanan #${order.id} ke kloter ${fallbackBatches[0].batch_number}`,
        });
      }
    }
  }

  for (const logItem of restockLogs) {
    try {
      await StockLog.create(logItem, { transaction });
    } catch (err) {
      console.warn("StockLog restock warning:", err.message);
    }
  }

  return restockLogs;
};

module.exports = { restockOrderFefo };

