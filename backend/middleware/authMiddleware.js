"use strict";
const jwt = require("jsonwebtoken");
const { User } = require("../models");

// 1. Validasi Token JWT (Apakah User Sudah Login?)
exports.authenticateToken = async (req, res, next) => {
  try {
    // Mengambil token dari header 'Authorization: Bearer <token>'
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Akses ditolak! Token otentikasi tidak ditemukan.",
      });
    }

    // Verifikasi token menggunakan JWT_SECRET dari .env
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          status: "error",
          message: "Token tidak valid atau sudah kedaluwarsa. Silakan login kembali.",
        });
      }

      // Opsional: Cek ke database apakah user-nya masih aktif/ada
      const userCheck = await User.findByPk(decoded.id);
      if (!userCheck) {
        return res.status(404).json({
          status: "error",
          message: "Pengguna yang terkait dengan token ini tidak ditemukan.",
        });
      }

      // Tempelkan data token ke request agar bisa dibaca oleh controller selanjutnya
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    });
  } catch (error) {
    next(error);
  }
};

// 2. Proteksi Khusus Admin (Hanya untuk Admin)
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Akses ditolak! Fitur ini hanya dapat diakses oleh Admin Apotek.",
    });
  }
  next();
};

// 3. Proteksi Fitur Logistik (Bisa diakses oleh Kurir dan juga Admin)
exports.isCourier = (req, res, next) => {
  if (req.user.role !== "kurir" && req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Akses ditolak! Fitur ini hanya untuk Kurir atau Admin Apotek.",
    });
  }
  next();
};
