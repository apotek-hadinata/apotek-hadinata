"use strict";
const { ChatRoom, ChatMessage, User, sequelize } = require("../models");

// 1. Mengirim Pesan (Pembeli ke Admin ATAU Admin ke Pembeli)
exports.sendMessage = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const { message, chat_room_id } = req.body;

    let targetRoomId = chat_room_id;

    // Jika pengirim adalah pembeli (user) biasa, otomatis cari atau buat room miliknya sendiri
    if (senderRole === "user") {
      const [room] = await ChatRoom.findOrCreate({
        where: { user_id: senderId },
        defaults: { last_message: message },
        transaction: t,
      });
      targetRoomId = room.id;
    }

    // Buat data pesan baru di tabel ChatMessages
    const newMessage = await ChatMessage.create(
      {
        chat_room_id: targetRoomId,
        sender_id: senderId,
        message,
      },
      { transaction: t },
    );

    // Update kolom 'last_message' di tabel ChatRoom untuk kebutuhan scannability sidebar chat
    await ChatRoom.update({ last_message: message }, { where: { id: targetRoomId }, transaction: t });

    await t.commit();

    return res.status(201).json({
      status: "success",
      message: "Pesan berhasil dikirim",
      data: newMessage,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 2. Mengambil Riwayat Chat (Dipakai Bersama oleh Pembeli & Admin)
exports.getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const senderRole = req.user.role;
    let targetRoomId = req.params.roomId;

    // Jika yang mengakses adalah pembeli biasa, langsung arahkan ke room miliknya sendiri
    if (senderRole === "user") {
      const room = await ChatRoom.findOne({ where: { user_id: userId } });

      // Jika pembeli belum pernah chat sama sekali, kembalikan array kosong dengan aman
      if (!room) {
        return res.status(200).json({ status: "success", data: [] });
      }
      targetRoomId = room.id;
    }

    // Ambil semua pesan yang ada di room tersebut, diurutkan dari pesan terlama ke terbaru
    const messages = await ChatMessage.findAll({
      where: { chat_room_id: targetRoomId },
      include: [{ model: User, attributes: ["id", "name", "role"] }],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      status: "success",
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Mengambil Semua Daftar Room Chat Aktif (Sisi Dashboard Admin)
// Digunakan admin untuk melihat list antrean pembeli mana saja yang sedang mengirim chat
exports.getAdminChatRooms = async (req, res, next) => {
  try {
    const rooms = await ChatRoom.findAll({
      include: [{ model: User, attributes: ["id", "name", "phone", "role"] }],
      order: [["updatedAt", "DESC"]], // Room dengan pesan terbaru akan naik ke paling atas
    });

    return res.status(200).json({
      status: "success",
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};
