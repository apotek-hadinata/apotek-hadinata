"use strict";
const { CartItem, Medicine, sequelize } = require("../models");

// 1. Tambah Obat ke Keranjang (Create / Update jika sudah ada)
exports.addToCart = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id; // Diambil dari middleware auth JWT
    const { medicine_id, quantity } = req.body;

    // Cek apakah obat tersebut sudah ada di keranjang user ini
    let cartItem = await CartItem.findOne({
      where: { user_id: userId, medicine_id },
      transaction: t,
    });

    if (cartItem) {
      // Jika sudah ada, akumulasikan jumlah kuantitasnya
      await cartItem.update(
        {
          quantity: cartItem.quantity + parseInt(quantity),
        },
        { transaction: t },
      );
    } else {
      // Jika belum ada, buat data baru
      cartItem = await CartItem.create(
        {
          user_id: userId,
          medicine_id,
          quantity,
        },
        { transaction: t },
      );
    }

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Obat berhasil dimasukkan ke keranjang",
      data: cartItem,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 2. Lihat Isi Keranjang Belanja User saat Ini (Read)
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cartItems = await CartItem.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Medicine,
          attributes: ["id", "name", "price", "SKU_code", "image", "status"],
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

// 3. Ubah Kuantitas Item di Keranjang (Update)
exports.updateCartQuantity = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params; // ID dari CartItem
    const { quantity } = req.body;

    const cartItem = await CartItem.findOne({
      where: { id, user_id: userId },
      transaction: t,
    });

    if (!cartItem) {
      await t.rollback();
      return res.status(404).json({ message: "Item di keranjang tidak ditemukan" });
    }

    await cartItem.update({ quantity }, { transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Kuantitas keranjang berhasil diperbarui",
      data: cartItem,
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
