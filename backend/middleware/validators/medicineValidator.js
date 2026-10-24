"use strict";
const { body, param } = require("express-validator");
const validateResult = require("../validationReporter");

exports.validateMedicine = [
  body("category_id").isInt().withMessage("Category ID harus berupa angka bulat"),
  body("name").trim().notEmpty().withMessage("Nama obat wajib diisi"),
  body("price").isInt({ min: 1 }).withMessage("Harga obat harus berupa angka di atas 0"),
  body("SKU_code").trim().notEmpty().withMessage("Kode SKU obat wajib diisi"),
  validateResult,
];

exports.validateBatch = [
  body("medicine_id").isInt().withMessage("Medicine ID harus berupa angka"),
  body("batch_number").trim().notEmpty().withMessage("Nomor batch wajib diisi"),
  body("expiry_date").isISO8601().toDate().withMessage("Format tanggal kedaluwarsa salah (wajib YYYY-MM-DD)"),
  body("stock").isInt({ min: 0 }).withMessage("Jumlah stok minimal 0"),
  validateResult,
];
