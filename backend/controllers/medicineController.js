"use strict";
const { Medicine, MedicineBatch, Category, sequelize } = require("../models");
const { Op } = require("sequelize");

// ==========================================
// 1. DOMAIN: MEDICINE (MASTER DATA OBAT)
// ==========================================

// Create Medicine
exports.createMedicine = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { category_id, name, desc, price, SKU_code, status, image } = req.body;

    const newMedicine = await Medicine.create(
      {
        category_id,
        name,
        desc: desc || null,
        price,
        SKU_code,
        status: status || "in stock",
        image: image || null,
      },
      { transaction: t },
    );

    await t.commit();

    return res.status(201).json({
      status: "success",
      message: "Data obat berhasil ditambahkan",
      data: newMedicine,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Read All Medicines
exports.getAllMedicines = async (req, res, next) => {
  try {
    const { search, category_id } = req.query;
    const whereClause = {};

    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    if (category_id) {
      whereClause.category_id = category_id;
    }

    const medicines = await Medicine.findAll({
      where: whereClause,
      include: [{ model: Category }, { model: MedicineBatch, as: "batches" }],
    });

    return res.status(200).json({
      status: "success",
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
};

// Read One Medicine By ID
exports.getMedicineById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findByPk(id, {
      include: [{ model: Category }, { model: MedicineBatch, as: "batches" }],
    });

    if (!medicine) {
      return res.status(404).json({ message: "Data obat tidak ditemukan" });
    }

    return res.status(200).json({
      status: "success",
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

// Update Medicine
exports.updateMedicine = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { category_id, name, desc, price, SKU_code, status, image } = req.body;

    const medicine = await Medicine.findByPk(id, { transaction: t });
    if (!medicine) {
      await t.rollback();
      return res.status(404).json({ message: "Data obat tidak ditemukan" });
    }

    await medicine.update(
      {
        category_id: category_id || medicine.category_id,
        name: name || medicine.name,
        desc: desc !== undefined ? desc : medicine.desc,
        price: price || medicine.price,
        SKU_code: SKU_code || medicine.SKU_code,
        status: status || medicine.status,
        image: image !== undefined ? image : medicine.image,
      },
      { transaction: t },
    );

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Data obat berhasil diperbarui",
      data: medicine,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Delete Medicine
exports.deleteMedicine = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const medicine = await Medicine.findByPk(id, { transaction: t });
    if (!medicine) {
      await t.rollback();
      return res.status(404).json({ message: "Data obat tidak ditemukan" });
    }

    await medicine.destroy({ transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Data obat berhasil dihapus dari sistem",
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ==========================================
// 2. DOMAIN: MEDICINE BATCH (STOK KLOTER)
// ==========================================

// Tambah Batch / Kloter Stok Baru
exports.addMedicineBatch = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { medicine_id, batch_number, expiry_date, stock } = req.body;

    const medicine = await Medicine.findByPk(medicine_id, { transaction: t });
    if (!medicine) {
      await t.rollback();
      return res.status(404).json({ message: "Gagal menambah batch, master obat tidak ditemukan" });
    }

    const newBatch = await MedicineBatch.create(
      {
        medicine_id,
        batch_number,
        expiry_date,
        stock,
      },
      { transaction: t },
    );

    await t.commit();

    return res.status(201).json({
      status: "success",
      message: "Kloter stok (batch) baru berhasil ditambahkan",
      data: newBatch,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Hapus Batch Tertentu
exports.deleteMedicineBatch = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { batchId } = req.params;

    const batch = await MedicineBatch.findByPk(batchId, { transaction: t });
    if (!batch) {
      await t.rollback();
      return res.status(404).json({ message: "Kloter stok (batch) tidak ditemukan" });
    }

    await batch.destroy({ transaction: t });
    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Kloter stok (batch) berhasil dihapus",
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Update Batch
exports.updateMedicineBatch = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { batchId } = req.params;
    const { batch_number, expiry_date, stock } = req.body;

    const batch = await MedicineBatch.findByPk(batchId, { transaction: t });
    if (!batch) {
      await t.rollback();
      return res.status(404).json({ message: "Kloter stok (batch) tidak ditemukan" });
    }

    await batch.update(
      {
        batch_number: batch_number || batch.batch_number,
        expiry_date: expiry_date || batch.expiry_date,
        stock: stock !== undefined ? stock : batch.stock,
      },
      { transaction: t },
    );

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Kloter stok (batch) berhasil diperbarui",
      data: batch,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
