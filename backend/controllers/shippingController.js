"use strict";
const {
  Shipping,
  Order,
  OrderItem,
  OrderItemBatch,
  MedicineBatch,
  StockLog,
  Payment,
  Medicine,
  User,
  Notification,
  DeliveryBatch,
  sequelize,
} = require("../models");
const { restockOrderFefo } = require("../utils/fefoRestock");

const serializeShipment = (shipInstance) => {
  const plain = shipInstance.toJSON ? shipInstance.toJSON() : shipInstance;
  if (plain.Order) {
    plain.Order.User = plain.Order.customer || plain.Order.User || null;
    plain.Order.OrderItems = plain.Order.items || plain.Order.OrderItems || [];
  }
  return plain;
};

const createSafeNotification = async (payload) => {
  try {
    await Notification.create(payload);
  } catch (err) {
    console.warn("Shipping notification warning:", err.message);
  }
};

const shipmentOrderInclude = {
  model: Order,
  include: [
    { model: User, as: "customer", attributes: ["id", "name", "phone", "address"] },
    {
      model: OrderItem,
      as: "items",
      include: [{ model: Medicine, attributes: ["id", "name", "price"] }],
    },
    { model: Payment },
  ],
};

// 1. Mengambil Daftar Pesanan yang Siap Dikirim (Sisi Pool Kurir)
// Mencari semua shipping berstatus 'pending' yang order-nya sudah di-ACC Admin ('processing' / 'ready_to_ship')
exports.getAvailableJobs = async (req, res, next) => {
  try {
    const jobs = await Shipping.findAll({
      where: { shipping_status: "pending", admin_id: null },
      include: [
        {
          ...shipmentOrderInclude,
          where: { order_status: ["processing", "ready_to_ship"] },
        },
        { model: DeliveryBatch, as: "deliveryBatch" },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      status: "success",
      data: jobs.map(serializeShipment),
    });
  } catch (error) {
    next(error);
  }
};

// 2. Mengambil Daftar Pengiriman Saya (Sisi Riwayat Internal Kurir)
exports.getMyShipments = async (req, res, next) => {
  try {
    const courierId = req.user.id;

    const shipments = await Shipping.findAll({
      where: { admin_id: courierId },
      include: [
        shipmentOrderInclude,
        { model: DeliveryBatch, as: "deliveryBatch" },
      ],
      order: [["updatedAt", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      data: shipments.map(serializeShipment),
    });
  } catch (error) {
    next(error);
  }
};

// 3. Mengambil Alih Pesanan untuk Dikirim (Pickup / Take Job + Alokasi DeliveryBatch Harian)
exports.pickupOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const courierId = req.user.id;

    const shipping = await Shipping.findByPk(id, {
      include: [{ model: Order }],
      transaction: t,
    });

    if (!shipping) {
      await t.rollback();
      return res.status(404).json({ message: "Data pengiriman tidak ditemukan" });
    }

    if (shipping.shipping_status !== "pending" || shipping.admin_id !== null) {
      await t.rollback();
      return res.status(400).json({ message: "Pesanan sudah diambil oleh kurir lain atau tidak tersedia" });
    }

    // Tentukan kloter keberangkatan (Shift 1: <14:00, Shift 2: >=14:00)
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const shiftNumber = now.getHours() < 14 ? 1 : 2;

    const [deliveryBatch] = await DeliveryBatch.findOrCreate({
      where: {
        delivery_date: todayStr,
        batch_number: shiftNumber,
      },
      defaults: {
        delivery_date: todayStr,
        batch_number: shiftNumber,
        capacity: 15,
      },
      transaction: t,
    });

    await shipping.update(
      {
        admin_id: courierId,
        shipping_status: "shipping",
        shipped_at: now,
        delivery_batch_id: deliveryBatch.id,
        delivery_date: todayStr,
      },
      { transaction: t }
    );

    await Order.update(
      { order_status: "shipping" },
      { where: { id: shipping.order_id }, transaction: t }
    );

    const courier = await User.findByPk(courierId, { attributes: ["name"], transaction: t });

    await t.commit();

    if (shipping.Order?.user_id) {
      await createSafeNotification({
        user_id: shipping.Order.user_id,
        title: `Pesanan #${shipping.order_id} Sedang Diantar`,
        message: `Kurir ${courier?.name || "Apotek Hadinata"} sedang mengantarkan paket obat ke alamat Anda (Kloter Shift ${shiftNumber}).`,
        type: "order_status",
        order_id: shipping.order_id,
      });
    }

    return res.status(200).json({
      status: "success",
      message: `Pesanan berhasil diambil! Masuk ke Kloter Kirim Shift ${shiftNumber}. Selamat bertugas di jalan.`,
      data: shipping,
      delivery_batch: deliveryBatch,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 4. Memperbarui Status Pengiriman (Ubah ke Delivered / Failed + Restock FEFO jika Gagal Kirim)
exports.updateShippingStatus = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const courierId = req.user.id;
    const { shipping_status } = req.body;

    const allowedStatuses = ["shipping", "delivered", "failed"];
    if (!allowedStatuses.includes(shipping_status)) {
      await t.rollback();
      return res.status(400).json({ message: "Status pengiriman tidak valid" });
    }

    const shipping = await Shipping.findOne({
      where: { id, admin_id: courierId },
      include: [{ model: Order }],
      transaction: t,
    });

    if (!shipping) {
      await t.rollback();
      return res.status(404).json({
        message: "Data pengiriman tidak ditemukan atau Anda bukan kurir penanggung jawab",
      });
    }

    const prevOrderStatus = shipping.Order?.order_status;
    const updateFields = { shipping_status };
    if (shipping_status === "delivered") {
      updateFields.delivered_at = new Date();
    }

    await shipping.update(updateFields, { transaction: t });

    // Sinkronisasi status order utama
    if (shipping_status === "delivered") {
      await Order.update(
        { order_status: "completed", payment_status: "paid" },
        { where: { id: shipping.order_id }, transaction: t }
      );
      await Payment.update(
        { payment_status: "success" },
        { where: { order_id: shipping.order_id }, transaction: t }
      );
    } else if (
      shipping_status === "failed" &&
      prevOrderStatus !== "cancelled" &&
      prevOrderStatus !== "completed"
    ) {
      // Kembalikan stok obat ke kloter asal via restockOrderFefo
      await restockOrderFefo({
        orderId: shipping.order_id,
        actorId: courierId,
        notePrefix: "Pengembalian stok gagal antar Kurir",
        transaction: t,
      });

      await Order.update(
        { order_status: "cancelled" },
        { where: { id: shipping.order_id }, transaction: t }
      );
    }

    await t.commit();

    if (shipping.Order?.user_id) {
      await createSafeNotification({
        user_id: shipping.Order.user_id,
        title:
          shipping_status === "delivered"
            ? `Pesanan #${shipping.order_id} Telah Tiba!`
            : `Pengantaran Pesanan #${shipping.order_id} Gagal`,
        message:
          shipping_status === "delivered"
            ? `Paket obat pesanan #${shipping.order_id} telah diterima di tujuan. Semoga lekas pulih!`
            : `Kurir melaporkan kendala pengantaran pada pesanan #${shipping.order_id}. Stok obat telah dikembalikan ke gerai, silakan hubungi CS Apotek.`,
        type: "order_status",
        order_id: shipping.order_id,
      });
    }

    return res.status(200).json({
      status: "success",
      message: `Status pengiriman berhasil diperbarui menjadi: ${shipping_status}`,
      data: shipping,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 5. Mengambil Rekap Kloter Keberangkatan Harian (DeliveryBatches)
exports.getDeliveryBatches = async (req, res, next) => {
  try {
    const batches = await DeliveryBatch.findAll({
      include: [
        {
          model: Shipping,
          as: "shippings",
          include: [{ model: Order, attributes: ["id", "recipient_name", "total_payment", "order_status"] }],
        },
      ],
      order: [
        ["delivery_date", "DESC"],
        ["batch_number", "ASC"],
      ],
      limit: 14,
    });

    return res.status(200).json({
      status: "success",
      data: batches,
    });
  } catch (error) {
    next(error);
  }
};
