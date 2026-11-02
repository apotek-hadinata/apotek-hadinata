"use strict";

const { Medicine, MedicineBatch, Notification, User } = require("../models");
const { Op } = require("sequelize");

const checkAndNotifyInventoryAlerts = async (medicineId) => {
  try {
    if (!medicineId) return;

    const medicine = await Medicine.findByPk(medicineId, {
      include: [{ model: MedicineBatch, as: "batches" }],
    });
    if (!medicine || !medicine.batches) return;

    const admins = await User.findAll({ where: { role: "admin" }, attributes: ["id"] });
    if (!admins.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const batch of medicine.batches) {
      const stock = batch.stock || 0;
      if (stock <= 0) continue;

      const expDate = new Date(batch.expiry_date);
      const daysRemaining = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 1. Alert: Stok menipis (<= 10 unit)
      if (stock <= 10) {
        const existingStockNotif = await Notification.findOne({
          where: {
            batch_id: batch.id,
            type: "stock",
            createdAt: { [Op.gte]: oneDayAgo },
          },
        });

        if (!existingStockNotif) {
          const notifications = admins.map((adm) => ({
            user_id: adm.id,
            title: `Peringatan Stok Menipis: ${medicine.name}`,
            message: `Stok obat ${medicine.name} pada kloter ${batch.batch_number} tersisa ${stock} unit. Segera rencanakan pengadaan ulang.`,
            type: "stock",
            batch_id: batch.id,
            is_read: false,
          }));
          await Notification.bulkCreate(notifications);
        }
      }

      // 2. Alert: Mendekati masa kedaluwarsa (<= 30 hari)
      if (daysRemaining <= 30) {
        const existingExpiryNotif = await Notification.findOne({
          where: {
            batch_id: batch.id,
            type: "near_expiry",
            createdAt: { [Op.gte]: oneDayAgo },
          },
        });

        if (!existingExpiryNotif) {
          const statusText = daysRemaining <= 0 ? "sudah kedaluwarsa!" : `akan kedaluwarsa dalam ${daysRemaining} hari.`;
          const notifications = admins.map((adm) => ({
            user_id: adm.id,
            title: `Peringatan Kedaluwarsa: ${medicine.name}`,
            message: `Kloter ${batch.batch_number} obat ${medicine.name} (ED: ${batch.expiry_date}) ${statusText}`,
            type: "near_expiry",
            batch_id: batch.id,
            is_read: false,
          }));
          await Notification.bulkCreate(notifications);
        }
      }
    }
  } catch (err) {
    console.warn("Inventory alert warning:", err.message);
  }
};

module.exports = { checkAndNotifyInventoryAlerts };

