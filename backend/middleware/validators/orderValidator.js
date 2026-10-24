"use strict";
const { body } = require("express-validator");
const validateResult = require("../validationReporter");

exports.validateOnlineCheckout = [
  body("items").isArray({ min: 1 }).withMessage("Harus ada minimal 1 obat yang dibeli"),
  body("items.*.medicine_id").isInt().withMessage("ID Obat di dalam item harus valid"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Kuantitas item minimal 1"),
  body("shipping_address").notEmpty().withMessage("Alamat pengiriman wajib diisi"),
  body("latitude").isFloat().withMessage("Koordinat Latitude tidak valid"),
  body("longitude").isFloat().withMessage("Koordinat Longitude tidak valid"),
  validateResult,
];

exports.validateOfflineCheckout = [
  body("customer_name").trim().notEmpty().withMessage("Nama pelanggan offline wajib dicatat"),
  body("items").isArray({ min: 1 }).withMessage("Item pembelian kasir tidak boleh kosong"),
  body("items.*.medicine_id").isInt().withMessage("ID Obat harus berupa angka"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Kuantitas minimal 1"),
  body("amount_paid").isInt().withMessage("Jumlah uang tunai yang dibayarkan wajib diisi"),
  validateResult,
];
