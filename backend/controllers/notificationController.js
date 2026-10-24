"use strict";
const { Notification, sequelize } = require("../models");

// 1. Ambil Semua Notifikasi Milik User yang Sedang Login (Read)
exports.getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Mengambil notifikasi yang ditujukan khusus untuk user_id tersebut
    // Diurutkan dari yang paling baru masuk (terbaru ke terlama)
    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Tandai Satu Notifikasi Sudah Dibaca (Update Status - Mark as Read)
exports.markAsRead = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params; // ID Notifikasi

    const notification = await Notification.findOne({
      where: { id, user_id: userId },
      transaction: t,
    });

    if (!notification) {
      await t.rollback();
      return res.status(404).json({ message: "Notifikasi tidak ditemukan" });
    }

    await notification.update({ is_read: true }, { transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Notifikasi berhasil ditandai sebagai telah dibaca",
      data: notification,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 3. Tandai Semua Notifikasi Sudah Dibaca Sekaligus (Bulk Update)
exports.markAllAsRead = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;

    // Mengubah status semua notifikasi milik user tersebut yang masih bernilai false
    await Notification.update(
      { is_read: true },
      {
        where: { user_id: userId, is_read: false },
        transaction: t,
      },
    );

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Semua notifikasi berhasil ditandai sebagai telah dibaca",
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 4. Hapus Satu Notifikasi (Delete)
exports.deleteNotification = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, user_id: userId },
      transaction: t,
    });

    if (!notification) {
      await t.rollback();
      return res.status(404).json({ message: "Notifikasi tidak ditemukan" });
    }

    await notification.destroy({ transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Notifikasi berhasil dihapus",
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
