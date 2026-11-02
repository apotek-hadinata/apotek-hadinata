"use strict";

const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads", "medicines");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const uniqueSuffix = `${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
    cb(null, `med-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung. Gunakan JPG, PNG, atau WEBP."));
  }
};

const uploadMedicinePhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024, // Maksimal 4 MB
  },
});

module.exports = { uploadMedicinePhoto };

