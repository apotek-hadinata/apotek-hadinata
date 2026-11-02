"use strict";
const { Medicine, MedicineBatch, Category, StockLog, User, sequelize } = require("../models");
const { Op } = require("sequelize");
const { recordActivityLog } = require("../utils/activityLogger");
const { checkAndNotifyInventoryAlerts } = require("../utils/inventoryAlerts");

// Helper: catat log mutasi stok secara aman tanpa menggagalkan transaksi utama
const recordStockLogSafe = async (payload) => {
  try {
    await StockLog.create(payload);
  } catch (err) {
    console.warn("StockLog warning:", err.message);
  }
};

// ==========================================
// 1. DOMAIN: MEDICINE (MASTER DATA OBAT)
// ==========================================

// Upload File Foto Produk Obat (Multer)
exports.uploadMedicineImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Pilih file gambar produk terlebih dahulu (JPG, PNG, WEBP maks. 4MB).",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/medicines/${req.file.filename}`;

    return res.status(201).json({
      status: "success",
      message: "Foto produk obat berhasil diunggah",
      imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    next(error);
  }
};

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
      { transaction: t }
    );

    await t.commit();

    await recordActivityLog({
      admin_id: req.user?.id,
      action: "CREATE_MEDICINE",
      description: `Admin menambahkan obat baru: ${name} (SKU: ${SKU_code}, Rp ${price})`,
      entity_type: "Medicine",
      entity_id: newMedicine.id,
      req,
    });

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
      { transaction: t }
    );

    await t.commit();

    await recordActivityLog({
      admin_id: req.user?.id,
      action: "UPDATE_MEDICINE",
      description: `Admin memperbarui obat #${medicine.id} (${medicine.name})`,
      entity_type: "Medicine",
      entity_id: medicine.id,
      req,
    });

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

    const medName = medicine.name;
    await medicine.destroy({ transaction: t });
    await t.commit();

    await recordActivityLog({
      admin_id: req.user?.id,
      action: "DELETE_MEDICINE",
      description: `Admin menghapus master obat #${id} (${medName})`,
      entity_type: "Medicine",
      entity_id: Number(id),
      req,
    });

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
// 2. DOMAIN: MEDICINE BATCH (STOK KLOTER) & FEFO LOGS
// ==========================================

// Ambil Riwayat Mutasi Stok & Audit Pemotongan FEFO
exports.getStockLogs = async (_req, res, next) => {
  try {
    const logs = await StockLog.findAll({
      include: [
        { model: Medicine, attributes: ["id", "name", "SKU_code"] },
        { model: MedicineBatch, attributes: ["id", "batch_number", "expiry_date"] },
        { model: User, as: "admin", attributes: ["id", "name", "role"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 150,
    });

    return res.status(200).json({
      status: "success",
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

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
      { transaction: t }
    );

    await t.commit();

    await recordStockLogSafe({
      medicine_id: Number(medicine_id),
      batch_id: newBatch.id,
      admin_id: req.user?.id || null,
      activity_type: "stock_in",
      quantity: Number(stock),
      stock_before: 0,
      stock_after: Number(stock),
      notes: `Penambahan kloter baru ${batch_number} (ED: ${String(expiry_date).slice(0, 10)})`,
    });

    await recordActivityLog({
      admin_id: req.user?.id,
      action: "ADD_MEDICINE_BATCH",
      description: `Admin menambahkan kloter ${batch_number} (${stock} unit, ED: ${String(expiry_date).slice(0, 10)}) untuk ${medicine.name}`,
      entity_type: "MedicineBatch",
      entity_id: newBatch.id,
      req,
    });

    // Peringatan otomatis jika stok sedikit atau dekat kedaluwarsa
    checkAndNotifyInventoryAlerts(medicine_id);

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

    const bNum = batch.batch_number;
    const medId = batch.medicine_id;
    await batch.destroy({ transaction: t });
    await t.commit();

    await recordActivityLog({
      admin_id: req.user?.id,
      action: "DELETE_MEDICINE_BATCH",
      description: `Admin menghapus kloter ${bNum} (Obat #${medId})`,
      entity_type: "MedicineBatch",
      entity_id: Number(batchId),
      req,
    });

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

    const prevStock = batch.stock;
    const nextStock = stock !== undefined ? Number(stock) : prevStock;

    await batch.update(
      {
        batch_number: batch_number || batch.batch_number,
        expiry_date: expiry_date || batch.expiry_date,
        stock: nextStock,
      },
      { transaction: t }
    );

    await t.commit();

    if (nextStock !== prevStock) {
      await recordStockLogSafe({
        medicine_id: batch.medicine_id,
        batch_id: batch.id,
        admin_id: req.user?.id || null,
        activity_type: "adjustment",
        quantity: Math.abs(nextStock - prevStock),
        stock_before: prevStock,
        stock_after: nextStock,
        notes: `Penyesuaian stok kloter ${batch.batch_number} (${prevStock} -> ${nextStock})`,
      });
    }

    await recordActivityLog({
      admin_id: req.user?.id,
      action: "UPDATE_MEDICINE_BATCH",
      description: `Admin memperbarui kloter ${batch.batch_number} (stok: ${prevStock} -> ${nextStock})`,
      entity_type: "MedicineBatch",
      entity_id: batch.id,
      req,
    });

    checkAndNotifyInventoryAlerts(batch.medicine_id);

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
