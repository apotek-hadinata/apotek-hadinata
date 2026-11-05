"use strict";

const { Op } = require("sequelize");
const { User } = require("../models");
const bcrypt = require("bcrypt");
const { recordActivityLog } = require("../utils/activityLogger");

// 1. Ambil Semua Pengguna (Filter Peran)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const where = {};
    if (role) {
      where.role = role;
    }
    if (search && String(search).trim()) {
      const keyword = `%${String(search).trim()}%`;
      where[Op.or] = [{ name: { [Op.like]: keyword } }, { email: { [Op.like]: keyword } }];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      total: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Admin Membuat Akun Staf / Kurir / Admin Baru
exports.createUserByAdmin = async (req, res, next) => {
  try {
    const { name, email, phone, password, address, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nama, email, dan password wajib diisi." });
    }

    const validRoles = ["admin", "kurir", "user"];
    const targetRole = validRoles.includes(role) ? role : "user";

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email sudah terdaftar di sistem." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : null,
      password: hashedPassword,
      address: address ? String(address).trim() : null,
      role: targetRole,
    });

    await recordActivityLog({
      admin_id: req.user.id,
      action: "CREATE_STAFF_ACCOUNT",
      description: `Admin #${req.user.id} membuat akun ${targetRole} baru: ${newUser.name} (${newUser.email})`,
      entity_type: "User",
      entity_id: newUser.id,
      req,
    });

    return res.status(201).json({
      status: "success",
      message: `Akun ${targetRole} baru berhasil dibuat.`,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        address: newUser.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Admin Mengubah Peran Pengguna
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["admin", "kurir", "user"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Peran pengguna tidak valid." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    if (user.id === req.user.id && role !== "admin") {
      return res.status(400).json({ message: "Anda tidak dapat mencabut hak akses admin Anda sendiri." });
    }

    const oldRole = user.role;
    await user.update({ role });

    await recordActivityLog({
      admin_id: req.user.id,
      action: "UPDATE_USER_ROLE",
      description: `Admin mengubah peran pengguna #${user.id} (${user.name}) dari '${oldRole}' menjadi '${role}'`,
      entity_type: "User",
      entity_id: user.id,
      req,
    });

    return res.status(200).json({
      status: "success",
      message: `Peran ${user.name} berhasil diubah menjadi ${role}.`,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

