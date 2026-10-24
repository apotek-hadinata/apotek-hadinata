"use strict";
const { body } = require("express-validator");
const validateResult = require("../validationReporter");

exports.validateCart = [body("medicine_id").isInt().withMessage("ID Obat harus valid"), body("quantity").isInt({ min: 1 }).withMessage("Kuantitas minimal pembelian adalah 1"), validateResult];
