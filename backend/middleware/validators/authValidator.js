"use strict";
const { body } = require("express-validator");
const validateResult = require("../validationReporter");

exports.validateRegister = [
  body("name").trim().notEmpty().withMessage("Nama lengkap tidak boleh kosong"),
  body("email").isEmail().withMessage("Format email tidak valid").normalizeEmail(),
  body("phone").trim().isMobilePhone("id-ID").withMessage("Nomor HP Indonesia tidak valid"),
  body("password").isLength({ min: 6 }).withMessage("Password minimal harus 6 karakter"),
  validateResult,
];

exports.validateLogin = [body("email").isEmail().withMessage("Email wajib diisi dengan benar"), body("password").notEmpty().withMessage("Password tidak boleh kosong"), validateResult];
