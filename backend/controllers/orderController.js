"use strict";
const { Order, OrderItem, Medicine, MedicineBatch, Payment, Shipping, User, sequelize } = require("../models");
const snap = require("../config/midtrans");

// ==========================================
// 1. ALUR TRANSAKSI: ONLINE CHECKOUT (USER)
// ==========================================
exports.createOnlineOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id; // Diambil dari token akses JWT
    const { items, shipping_cost, shipping_address, longitude, latitude, distance } = req.body;

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

      totalItemsPrice += medicine.price * item.quantity;

      orderItemsData.push({
        medicine_id: medicine.id,
        quantity: item.quantity,
        price_at_purchase: medicine.price,
      });

      // Algoritma Penjualan FEFO (First Expired First Out)
      let remainingQtyToDeduct = item.quantity;
      const sortedBatches = medicine.batches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

      for (const batch of sortedBatches) {
        if (remainingQtyToDeduct <= 0) break;

        if (batch.stock >= remainingQtyToDeduct) {
          batchUpdates.push({ batch, newStock: batch.stock - remainingQtyToDeduct });
          remainingQtyToDeduct = 0;
        } else {
          remainingQtyToDeduct -= batch.stock;
          batchUpdates.push({ batch, newStock: 0 });
        }
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
      },
      { transaction: t },
    );

    // Pembuatan Rincian Nota (Order Items)
    const itemsWithOrderId = orderItemsData.map((item) => ({ ...item, order_id: newOrder.id }));
    await OrderItem.bulkCreate(itemsWithOrderId, { transaction: t });

    // Pembuatan Data Logistik Pengiriman (Shipping)
    await Shipping.create(
      {
        order_id: newOrder.id,
        distance,
        shipping_address,
        longitude,
        latitude,
        shipping_status: "pending",
      },
      { transaction: t },
    );

    // Integrasi Midtrans Snap Gateway
    const transactionId = `ORDER-${newOrder.id}-${Date.now()}`;
    let redirectUrl = null;
    try {
      const midtransParams = {
        transaction_details: {
          order_id: transactionId,
          gross_amount: totalPayment,
        },
        credit_card: { secure: true },
      };
      const midtransTx = await snap.createTransaction(midtransParams);
      redirectUrl = midtransTx.redirect_url;
    } catch (midtransError) {
      console.warn("Midtrans notice (using simulated checkout url):", midtransError.message);
      redirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/simulated-order-${newOrder.id}`;
    }

    // Pencatatan Log Pembayaran Awal
    await Payment.create(
      {
        order_id: newOrder.id,
        payment_method: "QRIS",
        amount: totalPayment,
        payment_status: "pending",
        transaction_reference: transactionId,
        qr_string: redirectUrl,
      },
      { transaction: t },
    );

    await t.commit();

    return res.status(201).json({
      status: "success",
      message: "Order online berhasil dibuat",
      order_id: newOrder.id,
      redirect_url: redirectUrl,
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
    const { customer_name, items, payment_method, amount_paid } = req.body;

    let totalItemsPrice = 0;
    const orderItemsData = [];
    const batchUpdates = [];

    // Validasi stok & harga riil DB
    for (const item of items) {
      const medicine = await Medicine.findByPk(item.medicine_id, {
        include: [{ model: MedicineBatch, as: "batches" }],
        transaction: t,
      });

      if (!medicine) {
        await t.rollback();
        return res.status(404).json({ message: `Obat dengan ID ${item.medicine_id} tidak ditemukan` });
      }

      totalItemsPrice += medicine.price * item.quantity;

      orderItemsData.push({
        medicine_id: medicine.id,
        quantity: item.quantity,
        price_at_purchase: medicine.price,
      });

      // Potong stok dengan FEFO
      let remainingQtyToDeduct = item.quantity;
      const sortedBatches = medicine.batches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

      for (const batch of sortedBatches) {
        if (remainingQtyToDeduct <= 0) break;

        if (batch.stock >= remainingQtyToDeduct) {
          batchUpdates.push({ batch, newStock: batch.stock - remainingQtyToDeduct });
          remainingQtyToDeduct = 0;
        } else {
          remainingQtyToDeduct -= batch.stock;
          batchUpdates.push({ batch, newStock: 0 });
        }
      }

      if (remainingQtyToDeduct > 0) {
        await t.rollback();
        return res.status(400).json({ message: `Stok obat ${medicine.name} tidak mencukupi!` });
      }
    }

    for (const update of batchUpdates) {
      await update.batch.update({ stock: update.newStock }, { transaction: t });
    }

    // Nota Kasir Offline langsung bertanda Lunas ('paid') & Selesai ('completed')
    const newOrder = await Order.create(
      {
        user_id: null, // Null menandakan walk-in customer/pembeli offline
        total_items_price: totalItemsPrice,
        shipping_cost: 0,
        total_payment: totalItemsPrice,
        order_status: "completed",
        payment_status: "paid",
      },
      { transaction: t },
    );

    const itemsWithOrderId = orderItemsData.map((item) => ({ ...item, order_id: newOrder.id }));
    await OrderItem.bulkCreate(itemsWithOrderId, { transaction: t });

    // Catat log pembayaran kasir langsung sukses
    const change = amount_paid - totalItemsPrice; // Hitung uang kembalian
    await Payment.create(
      {
        order_id: newOrder.id,
        payment_method: payment_method || "CASH",
        amount: totalItemsPrice,
        payment_status: "success",
        transaction_reference: `POS-${newOrder.id}-${Date.now()}`,
        raw_response: JSON.stringify({ customer_name, amount_paid, change }),
      },
      { transaction: t },
    );

    await t.commit();

    return res.status(201).json({
      status: "success",
      message: "Transaksi kasir offline berhasil disimpan",
      order_id: newOrder.id,
      change: change >= 0 ? change : 0,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ==========================================
// 3. MONITORING DATA & DAFTAR RIWAYAT
// ==========================================

// Mengambil Semua Orderan (Sisi Dashboard Admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: User, attributes: ["id", "name", "email", "phone"] }, { model: OrderItem, include: [{ model: Medicine, attributes: ["id", "name", "price"] }] }, { model: Shipping }, { model: Payment }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ status: "success", data: orders });
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
      include: [{ model: OrderItem, include: [{ model: Medicine, attributes: ["id", "name", "price", "image"] }] }, { model: Shipping }, { model: Payment }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ status: "success", data: orders });
  } catch (error) {
    next(error);
  }
};

// Mengambil Detail Satu Order
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [{ model: User, attributes: ["id", "name", "email", "phone"] }, { model: OrderItem, include: [{ model: Medicine, attributes: ["id", "name", "price", "SKU_code", "image"] }] }, { model: Shipping }, { model: Payment }],
    });

    if (!order) {
      return res.status(404).json({ message: "Data pesanan tidak ditemukan" });
    }

    return res.status(200).json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

// Mengubah Status Pesanan (Sisi Admin, misal: memproses, menyerahkan ke kurir)
exports.updateOrderStatus = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    const order = await Order.findByPk(id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Data pesanan tidak ditemukan" });
    }

    await order.update({ order_status }, { transaction: t });
    await t.commit();

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
