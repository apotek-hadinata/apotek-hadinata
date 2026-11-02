"use strict";
const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const serializeUserSafe = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  role: user.role,
});

// 1. Register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, address, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email sudah terdaftar, silakan gunakan email lain" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : null,
      password: hashedPassword,
      address: address ? String(address).trim() : null,
      role: "user", // Keamanan: pendaftaran publik selalu berstatus 'user'
    });

    return res.status(201).json({
      status: "success",
      message: "Registrasi berhasil! Silakan masuk ke akun Anda",
      user: serializeUserSafe(newUser),
    });
  } catch (error) {
    next(error);
  }
};

// 2. Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      status: "success",
      message: "Login berhasil",
      token,
      user: serializeUserSafe(user),
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    return res.status(200).json({
      status: "success",
      user: serializeUserSafe(user),
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Profile (Nama, Nomor Telepon, Alamat Pengiriman Utama)
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    await user.update({
      name: name !== undefined && String(name).trim() !== "" ? String(name).trim() : user.name,
      phone: phone !== undefined ? String(phone).trim() : user.phone,
      address: address !== undefined ? String(address).trim() : user.address,
    });

    return res.status(200).json({
      status: "success",
      message: "Profil Anda berhasil diperbarui",
      user: serializeUserSafe(user),
    });
  } catch (error) {
    next(error);
  }
};

// 5. Change Password (Keamanan Akun)
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        message: "Password saat ini dan password baru wajib diisi.",
      });
    }

    if (String(new_password).length < 6) {
      return res.status(400).json({
        message: "Password baru minimal terdiri dari 6 karakter.",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    const isMatch = await bcrypt.compare(String(current_password), user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Password saat ini tidak sesuai.",
      });
    }

    const hashedNewPassword = await bcrypt.hash(String(new_password), 10);
    await user.update({ password: hashedNewPassword });

    return res.status(200).json({
      status: "success",
      message: "Password akun Anda berhasil diperbarui.",
    });
  } catch (error) {
    next(error);
  }
};
