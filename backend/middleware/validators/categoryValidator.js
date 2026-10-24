"use strict";
const { body } = require("express-validator");
const validateResult = require("../validationReporter");

exports.validateCategory = [body("name").trim().notEmpty().withMessage("Nama kategori wajib diisi"), validateResult];
