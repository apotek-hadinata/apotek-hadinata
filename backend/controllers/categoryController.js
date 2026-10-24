"use strict";
const { Category } = require("../models");

// 1. Membuat Kategori Baru (Create)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, desc } = req.body;

    const newCategory = await Category.create({
      name,
      desc: desc || null,
    });

    return res.status(201).json({
      status: "success",
      message: "Kategori berhasil ditambahkan",
      data: newCategory,
    });
  } catch (error) {
    next(error); // Error database langsung ditangkap global error handler Express 5
  }
};

// 2. Mengambil Semua Kategori (Read All)
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll();

    return res.status(200).json({
      status: "success",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Mengambil Satu Kategori Berdasarkan ID (Read One)
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }

    return res.status(200).json({
      status: "success",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Memperbarui Data Kategori (Update)
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, desc } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }

    // Melakukan update (jika field tidak dikirim/kosong, tetap pertahankan data lama di DB)
    await category.update({
      name: name || category.name,
      desc: desc !== undefined ? desc : category.desc,
    });

    return res.status(200).json({
      status: "success",
      message: "Kategori berhasil diperbarui",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Menghapus Kategori (Delete)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }

    await category.destroy();

    return res.status(200).json({
      status: "success",
      message: "Kategori berhasil dihapus",
    });
  } catch (error) {
    // Note: Karena di migrasi tabel Medicines kita pasang onDelete: "RESTRICT",
    // jika kategori ini masih memiliki relasi ke data obat, MySQL otomatis melempar error
    // dan langsung ditangani dengan aman oleh global error handler di server.js kelompokmu.
    next(error);
  }
};
