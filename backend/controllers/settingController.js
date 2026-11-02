"use strict";

const { SystemSetting, User } = require("../models");
const { recordActivityLog } = require("../utils/activityLogger");

const DEFAULT_SETTINGS = [
  {
    setting_key: "shipping_cost_default",
    setting_value: "10000",
    description: "Tarif standar ongkos kirim kurir internal apotek (Rupiah)",
  },
  {
    setting_key: "free_shipping_min_order",
    setting_value: "150000",
    description: "Ambang batas nominal belanja untuk fasilitas bebas ongkos kirim (Rupiah)",
  },
  {
    setting_key: "apotek_latitude",
    setting_value: "-7.7956",
    description: "Titik koordinat Latitude gerai fisik Apotek Hadinata",
  },
  {
    setting_key: "apotek_longitude",
    setting_value: "110.3695",
    description: "Titik koordinat Longitude gerai fisik Apotek Hadinata",
  },
  {
    setting_key: "sipa_number",
    setting_value: "464/SIPA-120/2026",
    description: "Nomor Surat Izin Praktik Apoteker (SIPA) resmi Kementerian Kesehatan",
  },
  {
    setting_key: "operational_hours",
    setting_value: "07.00 - 22.00 WIB",
    description: "Jam operasional gerai farmasi dan layanan kurir",
  },
  {
    setting_key: "store_phone",
    setting_value: "+62 812-7878-5387",
    description: "Nomor kontak resmi / WhatsApp CS Apotek Hadinata",
  },
  {
    setting_key: "store_address",
    setting_value: "Gerai Utama Apotek Hadinata, Jl. Kaliurang Km 5.5, Yogyakarta",
    description: "Alamat gerai fisik farmasi pusat",
  },
];

// Pastikan pengaturan dasar selalu ada (auto-initialize jika kosong)
const ensureDefaultSettings = async (adminId = null) => {
  for (const def of DEFAULT_SETTINGS) {
    await SystemSetting.findOrCreate({
      where: { setting_key: def.setting_key },
      defaults: {
        setting_value: def.setting_value,
        description: def.description,
        updated_by: adminId,
      },
    });
  }
};

// 1. Ambil Pengaturan Terbuka untuk Kalkulasi Transaksi (Publik / Frontend)
exports.getPublicSettings = async (req, res, next) => {
  try {
    await ensureDefaultSettings();

    const all = await SystemSetting.findAll();
    const settingsMap = {};
    for (const s of all) {
      settingsMap[s.setting_key] = s.setting_value;
    }

    return res.status(200).json({
      status: "success",
      data: settingsMap,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Ambil Semua Pengaturan Lengkap dengan Metadata (Sisi Admin)
exports.getAllSettingsAdmin = async (req, res, next) => {
  try {
    await ensureDefaultSettings(req.user.id);

    const all = await SystemSetting.findAll({
      include: [{ model: User, as: "updated_by_user", attributes: ["id", "name", "email"] }],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      status: "success",
      data: all,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Perbarui Pengaturan Sistem (Sisi Admin)
exports.updateSettings = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const settingsPayload = req.body; // e.g. { shipping_cost_default: "12000", free_shipping_min_order: "200000" }

    if (!settingsPayload || typeof settingsPayload !== "object") {
      return res.status(400).json({ message: "Payload pengaturan tidak valid." });
    }

    const updatedKeys = [];

    for (const [key, value] of Object.entries(settingsPayload)) {
      if (value === undefined || value === null) continue;

      const [record] = await SystemSetting.findOrCreate({
        where: { setting_key: key },
        defaults: {
          setting_value: String(value),
          updated_by: adminId,
        },
      });

      const oldValue = record.setting_value;
      if (oldValue !== String(value)) {
        await record.update({
          setting_value: String(value),
          updated_by: adminId,
        });
        updatedKeys.push(`${key}: ${oldValue} -> ${value}`);
      }
    }

    if (updatedKeys.length > 0) {
      await recordActivityLog({
        admin_id: adminId,
        action: "UPDATE_SYSTEM_SETTINGS",
        description: `Admin memperbarui pengaturan: ${updatedKeys.join(", ")}`,
        entity_type: "SystemSetting",
        req,
      });
    }

    const all = await SystemSetting.findAll();
    const settingsMap = {};
    for (const s of all) {
      settingsMap[s.setting_key] = s.setting_value;
    }

    return res.status(200).json({
      status: "success",
      message: "Pengaturan operasional apotek berhasil disimpan.",
      data: settingsMap,
    });
  } catch (error) {
    next(error);
  }
};

