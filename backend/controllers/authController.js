"use strict";
const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, address, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email sudah terdaftar, silakan gunakan email lain" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      address: address || null,
      role: role || "user",
    });

    return res.status(201).json({
      status: "success",
      message: "Registrasi berhasil! Silakan masuk ke akun Anda",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get Profile
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
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Update Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    // Eksekusi update data (jika field kosong, tetap pakai data lama di DB)
    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      address: address || user.address,
    });

    return res.status(200).json({
      status: "success",
      message: "Profil Anda berhasil diperbarui",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    next(error);
  }
};
