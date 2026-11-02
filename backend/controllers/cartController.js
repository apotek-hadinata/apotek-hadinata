"use strict";
const { CartItem, Medicine, MedicineBatch, sequelize } = require("../models");

// Helper: hitung total stok aktif dari kloter yang belum kedaluwarsa (FEFO compliant)
const getAvailableValidStock = (batches = []) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return batches.reduce((sum, b) => {
    const exp = new Date(b.expiry_date);
    const isNotExpired = !Number.isNaN(exp.getTime()) && exp >= startOfToday;
    return isNotExpired && (b.stock || 0) > 0 ? sum + Number(b.stock) : sum;
  }, 0);
};

// 1. Tambah Obat ke Keranjang (Create / Update jika sudah ada + Validasi Stok NFR #3)
exports.addToCart = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id; // Diambil dari middleware auth JWT
    const { medicine_id, quantity } = req.body;
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);

    const medicine = await Medicine.findByPk(medicine_id, {
      include: [{ model: MedicineBatch, as: "batches" }],
      transaction: t,
    });

    if (!medicine) {
      await t.rollback();
      return res.status(404).json({ message: "Data sediaan obat tidak ditemukan" });
    }

    const availableStock = getAvailableValidStock(medicine.batches || []);
    if (availableStock <= 0) {
      await t.rollback();
      return res.status(400).json({
        message: `Stok aktif untuk ${medicine.name} sedang habis atau telah melewati masa kedaluwarsa.`,
      });
    }

    // Cek apakah obat tersebut sudah ada di keranjang user ini
    let cartItem = await CartItem.findOne({
      where: { user_id: userId, medicine_id },
      transaction: t,
    });

    const targetQty = cartItem ? cartItem.quantity + parsedQty : parsedQty;
    if (targetQty > availableStock) {
      await t.rollback();
      return res.status(400).json({
        message: `Kuantitas melebihi sisa stok aktif ${medicine.name} (${availableStock} unit tersedia).`,
      });
    }

    if (cartItem) {
      await cartItem.update({ quantity: targetQty }, { transaction: t });
    } else {
      cartItem = await CartItem.create(
        {
          user_id: userId,
          medicine_id,
          quantity: parsedQty,
        },
        { transaction: t }
      );
    }

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Obat berhasil dimasukkan ke keranjang",
      data: cartItem,
      available_stock: availableStock,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 2. Lihat Isi Keranjang Belanja User saat Ini (Read + Sisa Stok Batch Aktif)
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cartItems = await CartItem.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Medicine,
          attributes: ["id", "name", "price", "SKU_code", "image", "status"],
          include: [
            {
              model: MedicineBatch,
              as: "batches",
              attributes: ["id", "batch_number", "expiry_date", "stock"],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      data: cartItems,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Ubah Kuantitas Item di Keranjang (Update + Validasi Stok NFR #3)
exports.updateCartQuantity = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params; // ID dari CartItem
    const parsedQty = parseInt(req.body.quantity, 10);

    if (!parsedQty || parsedQty < 1) {
      await t.rollback();
      return res.status(400).json({ message: "Kuantitas minimal adalah 1 unit" });
    }

    const cartItem = await CartItem.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: Medicine,
          include: [{ model: MedicineBatch, as: "batches" }],
        },
      ],
      transaction: t,
    });

    if (!cartItem) {
      await t.rollback();
      return res.status(404).json({ message: "Item di keranjang tidak ditemukan" });
    }

    const availableStock = getAvailableValidStock(cartItem.Medicine?.batches || []);
    if (parsedQty > availableStock) {
      await t.rollback();
      return res.status(400).json({
        message: `Kuantitas tidak dapat melebihi sisa stok aktif (${availableStock} unit tersedia).`,
      });
    }

    await cartItem.update({ quantity: parsedQty }, { transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Kuantitas keranjang berhasil diperbarui",
      data: cartItem,
      available_stock: availableStock,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 4. Hapus Satu Item dari Keranjang (Delete One)
exports.removeFromCart = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cartItem = await CartItem.findOne({
      where: { id, user_id: userId },
      transaction: t,
    });

    if (!cartItem) {
      await t.rollback();
      return res.status(404).json({ message: "Item di keranjang tidak ditemukan" });
    }

    await cartItem.destroy({ transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Item berhasil dihapus dari keranjang",
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 5. Kosongkan Seluruh Keranjang Belanja (Delete All)
exports.clearCart = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;

    await CartItem.destroy({
      where: { user_id: userId },
      transaction: t,
    });

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Seluruh isi keranjang belanja berhasil dikosongkan",
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
