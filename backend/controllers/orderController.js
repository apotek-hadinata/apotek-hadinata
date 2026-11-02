"use strict";
const {
  Order,
  OrderItem,
  OrderItemBatch,
  StockLog,
  Medicine,
  MedicineBatch,
  Payment,
  Shipping,
  User,
  Notification,
  OrderStatusHistory,
  sequelize,
} = require("../models");
const snap = require("../config/midtrans");
const { restockOrderFefo } = require("../utils/fefoRestock");
const { recordActivityLog } = require("../utils/activityLogger");
const { checkAndNotifyInventoryAlerts } = require("../utils/inventoryAlerts");

// Helper: normalisasi objek order agar kompatibel di seluruh komponen frontend
const serializeOrder = (orderInstance) => {
  const plain = orderInstance.toJSON ? orderInstance.toJSON() : orderInstance;
  return {
    ...plain,
    User: plain.customer || plain.User || null,
    OrderItems: plain.items || plain.OrderItems || [],
  };
};

// Helper: pastikan hanya kloter aktif yang belum melewati tanggal kedaluwarsa yang boleh dijual (FEFO)
const isBatchValidForDispense = (batch) => {
  if (!batch || (batch.stock || 0) <= 0) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const exp = new Date(batch.expiry_date);
  return !Number.isNaN(exp.getTime()) && exp >= startOfToday;
};

// Helper: kirim notifikasi sistem tanpa menggagalkan transaksi utama bila gagal
const createSafeNotifications = async (records) => {
  try {
    if (Array.isArray(records) && records.length > 0) {
      await Notification.bulkCreate(records);
    }
  } catch (err) {
    console.warn("Notification warning:", err.message);
  }
};

// Helper: simpan jejak audit pemotongan FEFO ke OrderItemBatches & StockLogs
const recordFefoAuditSafe = async ({ createdItems, batchAllocations, actorId, notePrefix }) => {
  try {
    const itemByMedId = {};
    for (const ci of createdItems) {
      if (!itemByMedId[ci.medicine_id]) itemByMedId[ci.medicine_id] = [];
      itemByMedId[ci.medicine_id].push(ci);
    }

    for (const alloc of batchAllocations) {
      const targetOrderItem = itemByMedId[alloc.medicineId]?.[0];
      if (targetOrderItem) {
        await OrderItemBatch.create({
          order_item_id: targetOrderItem.id,
          batch_id: alloc.batchId,
          quantity: alloc.deductedQty,
        });
      }

      await StockLog.create({
        medicine_id: alloc.medicineId,
        batch_id: alloc.batchId,
        admin_id: actorId || null,
        activity_type: "stock_out",
        quantity: alloc.deductedQty,
        stock_before: alloc.stockBefore,
        stock_after: alloc.stockAfter,
        notes: `${notePrefix} — Kloter ${alloc.batchNumber} (ED: ${alloc.expiryDate})`,
      });
    }
  } catch (err) {
    console.warn("FEFO audit log warning:", err.message);
  }
};

// ==========================================
// 1. ALUR TRANSAKSI: ONLINE CHECKOUT (USER)
// ==========================================
exports.createOnlineOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const {
      items,
      shipping_cost,
      shipping_address,
      longitude,
      latitude,
      distance,
      recipient_name,
      recipient_phone,
      payment_method,
    } = req.body;

    const chosenMethod = payment_method === "COD" ? "COD" : "QRIS";
    const buyer = await User.findByPk(userId, { transaction: t });

    let totalItemsPrice = 0;
    const orderItemsData = [];
    const batchUpdates = [];

    // Validasi stok komoditas & kalkulasi harga riil dari database
    for (const item of items) {
      const medicine = await Medicine.findByPk(item.medicine_id, {
        include: [{ model: MedicineBatch, as: "batches" }],
        transaction: t,
      });

      if (!medicine) {
        await t.rollback();
        return res.status(404).json({ message: `Obat dengan ID ${item.medicine_id} tidak ditemukan` });
      }

      const itemSubtotal = medicine.price * item.quantity;
      totalItemsPrice += itemSubtotal;

      orderItemsData.push({
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        SKU_code: medicine.SKU_code || `MED-${medicine.id}`,
        quantity: item.quantity,
        price_at_purchase: medicine.price,
        subtotal: itemSubtotal,
      });

      // Algoritma Penjualan FEFO (First Expired First Out)
      let remainingQtyToDeduct = item.quantity;
      const sortedBatches = [...(medicine.batches || [])]
        .filter((b) => isBatchValidForDispense(b))
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

      for (const batch of sortedBatches) {
        if (remainingQtyToDeduct <= 0) break;

        const stockBefore = batch.stock;
        const deductedQty = Math.min(stockBefore, remainingQtyToDeduct);
        const newStock = stockBefore - deductedQty;

        batchUpdates.push({
          batch,
          newStock,
          medicineId: medicine.id,
          batchId: batch.id,
          batchNumber: batch.batch_number,
          expiryDate: batch.expiry_date,
          deductedQty,
          stockBefore,
          stockAfter: newStock,
        });

        remainingQtyToDeduct -= deductedQty;
      }

      if (remainingQtyToDeduct > 0) {
        await t.rollback();
        return res.status(400).json({ message: `Stok obat ${medicine.name} tidak mencukupi!` });
      }
    }

    // Eksekusi pemotongan stok kloter batch obat
    for (const update of batchUpdates) {
      await update.batch.update({ stock: update.newStock }, { transaction: t });
    }

    const totalPayment = totalItemsPrice + (shipping_cost || 0);

    // Pembuatan Nota Induk (Order)
    const newOrder = await Order.create(
      {
        user_id: userId,
        total_items_price: totalItemsPrice,
        shipping_cost: shipping_cost || 0,
        total_payment: totalPayment,
        order_status: "pending",
        payment_status: "unpaid",
        recipient_name: recipient_name || buyer?.name || "Pelanggan",
        recipient_phone: recipient_phone || buyer?.phone || "-",
        shipping_address,
      },
      { transaction: t }
    );

    // Pembuatan Rincian Nota (Order Items)
    const createdItems = [];
    for (const item of orderItemsData) {
      const created = await OrderItem.create({ ...item, order_id: newOrder.id }, { transaction: t });
      createdItems.push(created);
    }

    // Pembuatan Data Logistik Pengiriman (Shipping)
    await Shipping.create(
      {
        order_id: newOrder.id,
        distance: distance || 0,
        shipping_address,
        longitude: longitude ?? 110.3695,
        latitude: latitude ?? -7.7956,
        shipping_status: "pending",
      },
      { transaction: t }
    );

    // Integrasi Midtrans Snap Gateway (jika non-COD)
    const prefix = chosenMethod === "COD" ? "COD" : "ORDER";
    const transactionId = `${prefix}-${newOrder.id}-${Date.now()}`;
    let redirectUrl = null;
    let snapToken = null;

    if (chosenMethod !== "COD") {
      try {
        const midtransParams = {
          transaction_details: {
            order_id: transactionId,
            gross_amount: totalPayment,
          },
          customer_details: {
            first_name: recipient_name || buyer?.name || "Pelanggan",
            email: buyer?.email,
            phone: recipient_phone || buyer?.phone,
          },
          credit_card: { secure: true },
        };
        const midtransTx = await snap.createTransaction(midtransParams);
        redirectUrl = midtransTx.redirect_url;
        snapToken = midtransTx.token || null;
      } catch (midtransError) {
        console.warn("Midtrans notice (using simulated checkout url):", midtransError.message);
        redirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/simulated-order-${newOrder.id}`;
      }
    }

    // Pencatatan Log Pembayaran Awal
    await Payment.create(
      {
        order_id: newOrder.id,
        payment_method: chosenMethod === "COD" ? "COD" : "QRIS",
        amount: totalPayment,
        payment_status: "pending",
        transaction_reference: transactionId,
        qr_string: redirectUrl,
        raw_response: JSON.stringify({
          method: chosenMethod,
          snap_token: snapToken,
          channel: chosenMethod === "COD" ? "Bayar di Tempat (COD)" : "Midtrans Snap / QRIS",
        }),
      },
      { transaction: t }
    );

    await t.commit();

    // Simpan jejak audit pemotongan kloter FEFO
    await recordFefoAuditSafe({
      createdItems,
      batchAllocations: batchUpdates,
      actorId: null,
      notePrefix: `Pemotongan otomatis FEFO Pesanan Online #${newOrder.id}`,
    });

    // Kirim notifikasi ke semua Admin & Pelanggan
    const admins = await User.findAll({ where: { role: "admin" }, attributes: ["id"] });
    const notifPayloads = [
      {
        user_id: userId,
        title: `Pesanan #${newOrder.id} Berhasil Dibuat`,
        message:
          chosenMethod === "COD"
            ? `Pesanan COD sebesar Rp ${totalPayment.toLocaleString("id-ID")} menunggu konfirmasi (ACC) Admin Apotek.`
            : `Pesanan sebesar Rp ${totalPayment.toLocaleString("id-ID")} telah tercatat. Silakan selesaikan pembayaran atau klik Cek Status Pembayaran.`,
        type: "order_status",
        order_id: newOrder.id,
      },
      ...admins.map((adm) => ({
        user_id: adm.id,
        title: `Pesanan Online Baru #${newOrder.id}`,
        message: `${recipient_name || buyer?.name || "Pelanggan"} membuat pesanan baru (${chosenMethod}) senilai Rp ${totalPayment.toLocaleString("id-ID")}. Segera lakukan validasi/ACC.`,
        type: "new_order",
        order_id: newOrder.id,
      })),
    ];
    await createSafeNotifications(notifPayloads);

    // Pantau dan berikan peringatan otomatis bila sisa stok menipis
    items.forEach((it) => checkAndNotifyInventoryAlerts(it.medicine_id));

    return res.status(201).json({
      status: "success",
      message: "Order online berhasil dibuat",
      order_id: newOrder.id,
      payment_method: chosenMethod,
      redirect_url: redirectUrl,
      snap_token: snapToken,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ==========================================
// 2. ALUR TRANSAKSI: POS KASIR OFFLINE (ADMIN)
// ==========================================
exports.createOfflineOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const adminId = req.user.id;
    const { customer_name, items, payment_method, amount_paid } = req.body;

    let totalItemsPrice = 0;
    const orderItemsData = [];
    const batchUpdates = [];

    for (const item of items) {
      const medicine = await Medicine.findByPk(item.medicine_id, {
        include: [{ model: MedicineBatch, as: "batches" }],
        transaction: t,
      });

      if (!medicine) {
        await t.rollback();
        return res.status(404).json({ message: `Obat dengan ID ${item.medicine_id} tidak ditemukan` });
      }

      const itemSubtotal = medicine.price * item.quantity;
      totalItemsPrice += itemSubtotal;

      orderItemsData.push({
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        SKU_code: medicine.SKU_code || `MED-${medicine.id}`,
        quantity: item.quantity,
        price_at_purchase: medicine.price,
        subtotal: itemSubtotal,
      });

      // Potong stok dengan FEFO
      let remainingQtyToDeduct = item.quantity;
      const sortedBatches = [...(medicine.batches || [])]
        .filter((b) => isBatchValidForDispense(b))
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

      for (const batch of sortedBatches) {
        if (remainingQtyToDeduct <= 0) break;

        const stockBefore = batch.stock;
        const deductedQty = Math.min(stockBefore, remainingQtyToDeduct);
        const newStock = stockBefore - deductedQty;

        batchUpdates.push({
          batch,
          newStock,
          medicineId: medicine.id,
          batchId: batch.id,
          batchNumber: batch.batch_number,
          expiryDate: batch.expiry_date,
          deductedQty,
          stockBefore,
          stockAfter: newStock,
        });

        remainingQtyToDeduct -= deductedQty;
      }

      if (remainingQtyToDeduct > 0) {
        await t.rollback();
        return res.status(400).json({ message: `Stok obat ${medicine.name} tidak mencukupi!` });
      }
    }

    if (Number(amount_paid) < totalItemsPrice) {
      await t.rollback();
      return res.status(400).json({
        message: `Nominal pembayaran (Rp ${Number(amount_paid).toLocaleString("id-ID")}) kurang dari total belanja (Rp ${totalItemsPrice.toLocaleString("id-ID")}).`,
      });
    }

    for (const update of batchUpdates) {
      await update.batch.update({ stock: update.newStock }, { transaction: t });
    }

    // Nota Kasir Offline langsung bertanda Lunas ('paid') & Selesai ('completed')
    const newOrder = await Order.create(
      {
        user_id: adminId,
        admin_id: adminId,
        total_items_price: totalItemsPrice,
        shipping_cost: 0,
        total_payment: totalItemsPrice,
        order_status: "completed",
        payment_status: "paid",
        recipient_name: `${customer_name} (POS Kasir)`,
        shipping_address: "Pembelian Langsung di Gerai Apotek Hadinata (POS Offline)",
      },
      { transaction: t }
    );

    const createdItems = [];
    for (const item of orderItemsData) {
      const created = await OrderItem.create({ ...item, order_id: newOrder.id }, { transaction: t });
      createdItems.push(created);
    }

    const chosenPosMethod = payment_method || "CASH";
    const change = Number(amount_paid) - totalItemsPrice;
    await Payment.create(
      {
        order_id: newOrder.id,
        payment_method: chosenPosMethod === "QRIS" ? "QRIS" : "CASH",
        amount: totalItemsPrice,
        payment_status: "success",
        transaction_reference: `POS-${chosenPosMethod}-${newOrder.id}-${Date.now()}`,
        raw_response: JSON.stringify({
          method: chosenPosMethod,
          source: "POS_OFFLINE",
          customer_name,
          amount_paid: Number(amount_paid),
          change,
        }),
      },
      { transaction: t }
    );

    await t.commit();

    // Simpan jejak audit pemotongan kloter FEFO
    await recordFefoAuditSafe({
      createdItems,
      batchAllocations: batchUpdates,
      actorId: adminId,
      notePrefix: `Pemotongan otomatis FEFO Kasir POS #${newOrder.id}`,
    });

    items.forEach((it) => checkAndNotifyInventoryAlerts(it.medicine_id));

    await recordActivityLog({
      admin_id: adminId,
      action: "POS_OFFLINE_TRANSACTION",
      description: `Kasir POS mencatat transaksi offline #${newOrder.id} untuk ${customer_name} (Total: Rp ${totalItemsPrice.toLocaleString("id-ID")}, Bayar: Rp ${Number(amount_paid).toLocaleString("id-ID")})`,
      entity_type: "Order",
      entity_id: newOrder.id,
      req,
    });

    return res.status(201).json({
      status: "success",
      message: "Transaksi kasir offline berhasil disimpan",
      order_id: newOrder.id,
      total_payment: totalItemsPrice,
      amount_paid: Number(amount_paid),
      change: change >= 0 ? change : 0,
      fefo_batches: batchUpdates.map((b) => ({
        medicine_id: b.medicineId,
        batch_number: b.batchNumber,
        expiry_date: b.expiryDate,
        quantity: b.deductedQty,
      })),
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ==========================================
// 3. VERIFIKASI PEMBAYARAN MIDTRANS LOKAL (TANPA NGROK)
// ==========================================
exports.verifyOrderPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const simulateSandbox = Boolean(req.body?.simulate_sandbox);

    const order = await Order.findByPk(id, {
      include: [{ model: Payment }],
    });

    if (!order) {
      return res.status(404).json({ message: "Data pesanan tidak ditemukan" });
    }

    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke pesanan ini" });
    }

    if (order.payment_status === "paid") {
      return res.status(200).json({
        status: "success",
        payment_status: "paid",
        order_status: order.order_status,
        message: "Pembayaran pesanan ini sudah terkonfirmasi LUNAS.",
      });
    }

    const payment = order.Payments && order.Payments[0];
    if (!payment) {
      return res.status(404).json({ message: "Catatan pembayaran tidak ditemukan untuk pesanan ini" });
    }

    if (payment.transaction_reference?.startsWith("COD-")) {
      return res.status(200).json({
        status: "success",
        payment_status: order.payment_status,
        order_status: order.order_status,
        message: "Pesanan COD dibayar tunai kepada kurir saat obat tiba di tujuan.",
      });
    }

    let settled = false;
    let midtransStatusLabel = "pending";
    let rawStatusPayload = null;

    // 1. Cek langsung ke Midtrans Transaction Status API
    try {
      const statusResponse = await snap.transaction.status(payment.transaction_reference);
      rawStatusPayload = statusResponse;
      midtransStatusLabel = statusResponse.transaction_status;

      if (
        statusResponse.transaction_status === "settlement" ||
        statusResponse.transaction_status === "capture"
      ) {
        settled = true;
      } else if (
        statusResponse.transaction_status === "cancel" ||
        statusResponse.transaction_status === "deny" ||
        statusResponse.transaction_status === "expire"
      ) {
        const wasActive = order.order_status !== "cancelled" && order.order_status !== "completed";
        await order.update({ payment_status: "failed", order_status: "cancelled" });
        await payment.update({
          payment_status: "failed",
          raw_response: JSON.stringify(statusResponse),
        });

        if (wasActive) {
          await restockOrderFefo({
            orderId: order.id,
            notePrefix: `Restock verifikasi Midtrans (${midtransStatusLabel})`,
          });
        }

        return res.status(200).json({
          status: "failed",
          payment_status: "failed",
          order_status: "cancelled",
          midtrans_status: midtransStatusLabel,
          message: `Transaksi Midtrans berstatus ${midtransStatusLabel} (dibatalkan/kedaluwarsa). Alokasi stok obat telah dikembalikan ke gerai.`,
        });
      }
    } catch (midErr) {
      // Apabila URL adalah fallback simulasi sandbox atau mode simulasi lokal diaktifkan saat development
      const isSimulatedOrder = payment.qr_string?.includes("simulated-order-");
      if ((isSimulatedOrder || simulateSandbox) && process.env.NODE_ENV !== "production") {
        settled = true;
        midtransStatusLabel = "sandbox_settlement";
        rawStatusPayload = {
          mode: "LOCAL_SANDBOX_VERIFICATION",
          verified_at: new Date().toISOString(),
          note: midErr.message,
        };
      }
    }

    // Dukungan tombol Simulasi Lunas Sandbox saat presentasi/demo lokal jika Midtrans masih pending
    if (!settled && simulateSandbox && process.env.NODE_ENV !== "production") {
      settled = true;
      midtransStatusLabel = "sandbox_settlement";
      rawStatusPayload = {
        mode: "LOCAL_SANDBOX_SIMULATION",
        verified_at: new Date().toISOString(),
      };
    }

    if (settled) {
      const nextOrderStatus =
        order.order_status === "pending" || order.order_status === "pending_payment"
          ? "processing"
          : order.order_status;

      await order.update({
        payment_status: "paid",
        order_status: nextOrderStatus,
      });

      await payment.update({
        payment_status: "success",
        raw_response: JSON.stringify(rawStatusPayload || { status: midtransStatusLabel }),
      });

      // Beritahu pelanggan, admin, dan kurir
      const couriers = await User.findAll({ where: { role: "kurir" }, attributes: ["id"] });
      const admins = await User.findAll({ where: { role: "admin" }, attributes: ["id"] });
      await createSafeNotifications([
        {
          user_id: order.user_id,
          title: `Pembayaran Pesanan #${order.id} Lunas`,
          message: `Pembayaran pesanan #${order.id} telah terverifikasi LUNAS dan sedang disiapkan untuk kurir.`,
          type: "order_status",
          order_id: order.id,
        },
        ...admins.map((a) => ({
          user_id: a.id,
          title: `Pembayaran Lunas #${order.id}`,
          message: `Pesanan #${order.id} telah lunas terverifikasi via Midtrans.`,
          type: "order_status",
          order_id: order.id,
        })),
        ...couriers.map((c) => ({
          user_id: c.id,
          title: `Tugas Antar Baru #${order.id}`,
          message: `Pesanan #${order.id} sudah lunas dan siap diambil di Apotek.`,
          type: "order_status",
          order_id: order.id,
        })),
      ]);

      return res.status(200).json({
        status: "success",
        payment_status: "paid",
        order_status: nextOrderStatus,
        midtrans_status: midtransStatusLabel,
        message: "Pembayaran terverifikasi LUNAS! Pesanan otomatis diteruskan ke antrean pengiriman.",
      });
    }

    return res.status(200).json({
      status: "pending",
      payment_status: order.payment_status,
      order_status: order.order_status,
      midtrans_status: midtransStatusLabel,
      message: "Status Midtrans masih menunggu pembayaran (pending). Selesaikan pembayaran di halaman Snap terlebih dahulu.",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. MONITORING DATA & DAFTAR RIWAYAT
// ==========================================

const orderIncludes = [
  { model: User, as: "customer", attributes: ["id", "name", "email", "phone", "address"] },
  { model: User, as: "handled_by", attributes: ["id", "name", "email"] },
  {
    model: OrderItem,
    as: "items",
    include: [
      { model: Medicine, attributes: ["id", "name", "price", "SKU_code", "image"] },
      {
        model: OrderItemBatch,
        include: [{ model: MedicineBatch, attributes: ["id", "batch_number", "expiry_date"] }],
      },
    ],
  },
  {
    model: Shipping,
    include: [{ model: User, as: "admin", attributes: ["id", "name", "phone", "role"] }],
  },
  { model: Payment },
];

// Mengambil Semua Orderan (Sisi Dashboard Admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: orderIncludes,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      data: orders.map(serializeOrder),
    });
  } catch (error) {
    next(error);
  }
};

// Mengambil Riwayat Belanja User Tertentu (Sisi Mobile/Web Pembeli)
exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orders = await Order.findAll({
      where: { user_id: userId },
      include: orderIncludes,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      data: orders.map(serializeOrder),
    });
  } catch (error) {
    next(error);
  }
};

// Mengambil Detail Satu Order
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: orderIncludes,
    });

    if (!order) {
      return res.status(404).json({ message: "Data pesanan tidak ditemukan" });
    }

    return res.status(200).json({
      status: "success",
      data: serializeOrder(order),
    });
  } catch (error) {
    next(error);
  }
};

// Mengubah Status Pesanan (Sisi Admin: ACC / proses kurir / selesaikan / batalkan)
exports.updateOrderStatus = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    const order = await Order.findByPk(id, {
      include: [
        { model: OrderItem, as: "items", include: [{ model: OrderItemBatch }] },
        { model: Payment },
      ],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Data pesanan tidak ditemukan" });
    }

    const oldStatus = order.order_status;

    // Kembalikan stok ke kloter asal apabila pesanan dibatalkan/ditolak
    if (
      (order_status === "cancelled" || order_status === "rejected") &&
      oldStatus !== "cancelled" &&
      oldStatus !== "rejected" &&
      oldStatus !== "completed"
    ) {
      await restockOrderFefo({
        orderId: order.id,
        actorId: req.user.id,
        notePrefix: `Pengembalian stok pembatalan Admin`,
        transaction: t,
      });
    }

    const updatePayload = {
      order_status,
      admin_id: req.user.id,
    };

    if (payment_status) {
      updatePayload.payment_status = payment_status;
    } else if (order_status === "completed") {
      updatePayload.payment_status = "paid";
    }

    await order.update(updatePayload, { transaction: t });

    if (updatePayload.payment_status === "paid" && order.Payments && order.Payments.length > 0) {
      await Payment.update(
        { payment_status: "success" },
        { where: { order_id: order.id }, transaction: t }
      );
    }

    await t.commit();

    await recordActivityLog({
      admin_id: req.user.id,
      action: "UPDATE_ORDER_STATUS",
      description: `Admin memperbarui status Pesanan #${order.id} dari '${oldStatus}' menjadi '${order_status}'`,
      entity_type: "Order",
      entity_id: order.id,
      req,
    });

    // Catat riwayat perubahan status (best-effort)
    try {
      await OrderStatusHistory.create({
        order_id: order.id,
        changed_by: req.user.id,
        old_status: oldStatus,
        new_status: order_status,
        notes: `Diperbarui oleh Admin (#${req.user.id})`,
      });
    } catch {
      // Abaikan jika nama tabel history berbeda antar environment
    }

    // Kirim notifikasi ke pelanggan & kurir
    const statusLabels = {
      processing: "telah disetujui (ACC) oleh Apotek dan sedang disiapkan untuk kurir",
      ready_to_ship: "siap diserahkan ke kurir pengantar",
      shipping: "sedang dalam pengantaran menuju alamat Anda",
      completed: "telah selesai. Terima kasih telah berbelanja di Apotek Hadinata",
      cancelled: "telah dibatalkan oleh pihak Apotek",
      rejected: "ditolak oleh pihak Apotek",
    };

    const notifs = [
      {
        user_id: order.user_id,
        title: `Update Pesanan #${order.id}`,
        message: `Pesanan #${order.id} Anda ${statusLabels[order_status] || `berubah status menjadi ${order_status}`}.`,
        type: "order_status",
        order_id: order.id,
      },
    ];

    if (order_status === "processing") {
      const couriers = await User.findAll({ where: { role: "kurir" }, attributes: ["id"] });
      couriers.forEach((c) => {
        notifs.push({
          user_id: c.id,
          title: `Tugas Antar Baru #${order.id}`,
          message: `Pesanan #${order.id} tujuan ${order.shipping_address || "pelanggan"} siap diambil di Apotek.`,
          type: "order_status",
          order_id: order.id,
        });
      });
    }

    await createSafeNotifications(notifs);

    return res.status(200).json({
      status: "success",
      message: `Status pesanan berhasil diubah menjadi ${order_status}`,
      data: order,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ==========================================
// 5. PEMBATALAN PESANAN MANDIRI OLEH PELANGGAN
// ==========================================
exports.cancelMyOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, user_id: userId },
      include: [{ model: Payment }],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Pesanan tidak ditemukan atau bukan milik Anda." });
    }

    if (order.order_status !== "pending" && order.order_status !== "pending_payment") {
      await t.rollback();
      return res.status(400).json({
        message: `Pesanan berstatus '${order.order_status}' dan tidak dapat dibatalkan secara mandiri. Silakan hubungi CS Apotek.`,
      });
    }

    if (order.payment_status === "paid") {
      await t.rollback();
      return res.status(400).json({
        message: "Pesanan sudah terbayar lunas. Pembatalan harus diproses melalui CS Apotek.",
      });
    }

    await order.update({ order_status: "cancelled" }, { transaction: t });

    if (order.Payments && order.Payments.length > 0) {
      await Payment.update(
        { payment_status: "failed" },
        { where: { order_id: order.id }, transaction: t }
      );
    }

    await t.commit();

    // Kembalikan alokasi kloter FEFO
    await restockOrderFefo({
      orderId: order.id,
      actorId: null,
      notePrefix: "Pembatalan mandiri oleh Pelanggan",
    });

    // Beritahukan Admin
    const admins = await User.findAll({ where: { role: "admin" }, attributes: ["id"] });
    await createSafeNotifications(
      admins.map((adm) => ({
        user_id: adm.id,
        title: `Pesanan #${order.id} Dibatalkan Pelanggan`,
        message: `Pelanggan telah membatalkan pesanan #${order.id}. Stok obat telah otomatis dikembalikan ke kloter FEFO gerai.`,
        type: "order_status",
        order_id: order.id,
      }))
    );

    return res.status(200).json({
      status: "success",
      message: "Pesanan Anda berhasil dibatalkan dan alokasi stok telah dikembalikan ke gerai.",
      data: {
        id: order.id,
        order_status: "cancelled",
      },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
