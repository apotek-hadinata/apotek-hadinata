"use strict";

const { CustomerAddress, sequelize } = require("../models");

// 1. Ambil Semua Alamat Tersimpan Milik Pengguna
exports.getMyAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await CustomerAddress.findAll({
      where: { user_id: userId },
      order: [
        ["is_default", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.status(200).json({
      status: "success",
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Tambah Alamat Baru ke Buku Alamat
exports.createAddress = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const {
      label,
      recipient_name,
      recipient_phone,
      address,
      latitude,
      longitude,
      is_default,
    } = req.body;

    if (!recipient_name || !recipient_phone || !address) {
      await t.rollback();
      return res.status(400).json({
        message: "Nama penerima, nomor telepon, dan alamat lengkap wajib diisi.",
      });
    }

    const countExisting = await CustomerAddress.count({
      where: { user_id: userId },
      transaction: t,
    });

    // Jika alamat pertama, otomatis jadikan default
    const makeDefault = Boolean(is_default) || countExisting === 0;

    if (makeDefault) {
      await CustomerAddress.update(
        { is_default: false },
        { where: { user_id: userId }, transaction: t }
      );
    }

    const newAddress = await CustomerAddress.create(
      {
        user_id: userId,
        label: label && String(label).trim() ? String(label).trim() : "Rumah",
        recipient_name: String(recipient_name).trim(),
        recipient_phone: String(recipient_phone).trim(),
        address: String(address).trim(),
        latitude: Number(latitude) || -7.7956,
        longitude: Number(longitude) || 110.3695,
        is_default: makeDefault,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      status: "success",
      message: "Alamat baru berhasil disimpan ke Buku Alamat.",
      data: newAddress,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 3. Perbarui Alamat Tertentu
exports.updateAddress = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      label,
      recipient_name,
      recipient_phone,
      address,
      latitude,
      longitude,
      is_default,
    } = req.body;

    const existing = await CustomerAddress.findOne({
      where: { id, user_id: userId },
      transaction: t,
    });

    if (!existing) {
      await t.rollback();
      return res.status(404).json({ message: "Data alamat tidak ditemukan." });
    }

    if (is_default) {
      await CustomerAddress.update(
        { is_default: false },
        { where: { user_id: userId }, transaction: t }
      );
    }

    await existing.update(
      {
        label: label !== undefined ? String(label).trim() : existing.label,
        recipient_name: recipient_name !== undefined ? String(recipient_name).trim() : existing.recipient_name,
        recipient_phone: recipient_phone !== undefined ? String(recipient_phone).trim() : existing.recipient_phone,
        address: address !== undefined ? String(address).trim() : existing.address,
        latitude: latitude !== undefined ? Number(latitude) : existing.latitude,
        longitude: longitude !== undefined ? Number(longitude) : existing.longitude,
        is_default: is_default !== undefined ? Boolean(is_default) : existing.is_default,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Data alamat berhasil diperbarui.",
      data: existing,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 4. Jadikan Alamat Utama (Default)
exports.setDefaultAddress = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const target = await CustomerAddress.findOne({
      where: { id, user_id: userId },
      transaction: t,
    });

    if (!target) {
      await t.rollback();
      return res.status(404).json({ message: "Data alamat tidak ditemukan." });
    }

    await CustomerAddress.update(
      { is_default: false },
      { where: { user_id: userId }, transaction: t }
    );

    await target.update({ is_default: true }, { transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "success",
      message: `Alamat "${target.label}" berhasil ditetapkan sebagai alamat pengiriman utama.`,
      data: target,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 5. Hapus Alamat
exports.deleteAddress = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const target = await CustomerAddress.findOne({
      where: { id, user_id: userId },
      transaction: t,
    });

    if (!target) {
      await t.rollback();
      return res.status(404).json({ message: "Data alamat tidak ditemukan." });
    }

    const wasDefault = target.is_default;
    await target.destroy({ transaction: t });

    // Jika yang dihapus adalah alamat default, tunjuk alamat lain yang tersisa (jika ada)
    if (wasDefault) {
      const remaining = await CustomerAddress.findOne({
        where: { user_id: userId },
        order: [["createdAt", "DESC"]],
        transaction: t,
      });
      if (remaining) {
        await remaining.update({ is_default: true }, { transaction: t });
      }
    }

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Alamat berhasil dihapus dari Buku Alamat.",
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

