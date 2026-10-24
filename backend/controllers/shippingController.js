"use strict";
const { Shipping, Order, User, sequelize } = require("../models");

// 1. Mengambil Daftar Pesanan yang Siap Dikirim (Sisi Pool Kurir)
// Mencari semua shipping yang belum punya kurir ('pending') dan order-nya sedang diproses ('processing')
exports.getAvailableJobs = async (req, res, next) => {
  try {
    const jobs = await Shipping.findAll({
      where: { shipping_status: "pending" },
      include: [
        {
          model: Order,
          where: { order_status: "processing" },
          include: [{ model: User, attributes: ["id", "name", "phone"] }],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      status: "success",
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Mengambil Daftar Pengiriman Saya (Sisi Riwayat Internal Kurir)
// Melihat pesanan yang sedang atau sudah selesai diantarkan oleh kurir yang sedang login
exports.getMyShipments = async (req, res, next) => {
  try {
    const courierId = req.user.id; // Diambil dari token akses JWT

    const shipments = await Shipping.findAll({
      where: { courier_id: courierId },
      include: [
        {
          model: Order,
          include: [{ model: User, attributes: ["id", "name", "phone"] }],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      data: shipments,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Mengambil Alih Pesanan untuk Dikirim (Pickup / Take Job)
exports.pickupOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params; // ID data Shipping
    const courierId = req.user.id;

    const shipping = await Shipping.findByPk(id, { transaction: t });
    if (!shipping) {
      await t.rollback();
      return res.status(404).json({ message: "Data pengiriman tidak ditemukan" });
    }

    // Validasi agar pesanan tidak rebutan diambil oleh kurir lain
    if (shipping.shipping_status !== "pending" || shipping.courier_id !== null) {
      await t.rollback();
      return res.status(400).json({ message: "Pesanan sudah diambil oleh kurir lain atau tidak tersedia" });
    }

    // Update data kurir pengantar dan ubah status kiriman jadi 'shipping'
    await shipping.update(
      {
        courier_id: courierId,
        shipping_status: "shipping",
      },
      { transaction: t },
    );

    // Update status di nota induk Order menjadi 'shipping' (sedang di jalan)
    await Order.update({ order_status: "shipping" }, { where: { id: shipping.order_id }, transaction: t });

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Pesanan berhasil diambil! Selamat bertugas di jalan",
      data: shipping,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 4. Memperbarui Status Pengiriman (Ubah ke Delivered / Gagal)
exports.updateShippingStatus = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const courierId = req.user.id;
    const { shipping_status } = req.body; // Ekspektasi nilai: 'delivered' atau 'failed'

    // Pastikan kiriman tersebut memang dipegang oleh kurir yang bersangkutan
    const shipping = await Shipping.findOne({
      where: { id, courier_id: courierId },
      transaction: t,
    });

    if (!shipping) {
      await t.rollback();
      return res.status(404).json({ message: "Data pengiriman tidak ditemukan atau Anda bukan kurir penanggung jawab" });
    }

    const updateFields = { shipping_status };
    if (shipping_status === "delivered") {
      updateFields.delivered_at = new Date(); // Catat waktu barang sampai ke tangan pembeli
    }

    await shipping.update(updateFields, { transaction: t });

    // Sinkronisasi status order utama berdasarkan hasil pengantaran
    let targetOrderStatus = "shipping";
    if (shipping_status === "delivered") {
      targetOrderStatus = "completed"; // Pesanan selesai 100%
    } else if (shipping_status === "failed") {
      targetOrderStatus = "failed";
    }

    await Order.update({ order_status: targetOrderStatus }, { where: { id: shipping.order_id }, transaction: t });

    await t.commit();

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
