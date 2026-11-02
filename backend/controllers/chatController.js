"use strict";
const { Op } = require("sequelize");
const { ChatRoom, ChatMessage, User, Notification, sequelize } = require("../models");

const createSafeNotifications = async (records) => {
  try {
    if (Array.isArray(records) && records.length > 0) {
      await Notification.bulkCreate(records);
    }
  } catch (err) {
    console.warn("Chat notification warning:", err.message);
  }
};

// 1. Mengirim Pesan (Pembeli ke Admin ATAU Admin ke Pembeli)
exports.sendMessage = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const { message, chat_room_id, room_id } = req.body;

    if (!message || !String(message).trim()) {
      await t.rollback();
      return res.status(400).json({ message: "Isi pesan tidak boleh kosong" });
    }

    let targetRoomId = room_id || chat_room_id;
    let roomInstance = null;

    if (senderRole === "user") {
      const [room] = await ChatRoom.findOrCreate({
        where: { user_id: senderId },
        defaults: { user_id: senderId },
        transaction: t,
      });
      targetRoomId = room.id;
      roomInstance = room;
    } else {
      if (!targetRoomId) {
        await t.rollback();
        return res.status(400).json({ message: "ID Room Chat pelanggan wajib disertakan" });
      }
      roomInstance = await ChatRoom.findByPk(targetRoomId, { transaction: t });
      if (!roomInstance) {
        await t.rollback();
        return res.status(404).json({ message: "Room chat pelanggan tidak ditemukan" });
      }
    }

    const cleanMessage = String(message).trim();

    const newMessage = await ChatMessage.create(
      {
        room_id: targetRoomId,
        sender_id: senderId,
        message: cleanMessage,
        is_read: false,
      },
      { transaction: t }
    );

    // Sentuh updatedAt pada ChatRoom agar naik ke urutan teratas daftar percakapan
    roomInstance.changed("updatedAt", true);
    await roomInstance.save({ transaction: t });

    const fullMessage = await ChatMessage.findByPk(newMessage.id, {
      include: [{ model: User, attributes: ["id", "name", "role"] }],
      transaction: t,
    });

    const senderUser = await User.findByPk(senderId, {
      attributes: ["id", "name", "role"],
      transaction: t,
    });

    await t.commit();

    // Kirim notifikasi ke lawan bicara
    if (senderRole === "user") {
      const admins = await User.findAll({ where: { role: "admin" }, attributes: ["id"] });
      await createSafeNotifications(
        admins.map((adm) => ({
          user_id: adm.id,
          title: `Pesan Konsultasi dari ${senderUser?.name || "Pelanggan"}`,
          message: cleanMessage.length > 90 ? `${cleanMessage.slice(0, 90)}...` : cleanMessage,
          type: "chat",
          chat_id: targetRoomId,
        }))
      );
    } else if (roomInstance?.user_id) {
      await createSafeNotifications([
        {
          user_id: roomInstance.user_id,
          title: "Balasan Apoteker / CS Hadinata",
          message: cleanMessage.length > 90 ? `${cleanMessage.slice(0, 90)}...` : cleanMessage,
          type: "chat",
          chat_id: targetRoomId,
        },
      ]);
    }

    return res.status(201).json({
      status: "success",
      message: "Pesan berhasil dikirim",
      data: fullMessage || newMessage,
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

    if (senderRole === "user") {
      const room = await ChatRoom.findOne({ where: { user_id: userId } });
      if (!room) {
        return res.status(200).json({ status: "success", room_id: null, data: [] });
      }
      targetRoomId = room.id;
    }

    if (!targetRoomId) {
      return res.status(400).json({ message: "Room ID tidak ditemukan" });
    }

    // Tandai pesan dari lawan bicara sebagai sudah dibaca
    await ChatMessage.update(
      { is_read: true },
      {
        where: {
          room_id: targetRoomId,
          sender_id: { [Op.ne]: userId },
          is_read: false,
        },
      }
    );

    const messages = await ChatMessage.findAll({
      where: { room_id: targetRoomId },
      include: [{ model: User, attributes: ["id", "name", "role"] }],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      status: "success",
      room_id: Number(targetRoomId),
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Mengambil Semua Daftar Room Chat Aktif (Sisi Dashboard Admin)
exports.getAdminChatRooms = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const rooms = await ChatRoom.findAll({
      include: [
        { model: User, attributes: ["id", "name", "email", "phone", "role"] },
        {
          model: ChatMessage,
          separate: true,
          order: [["createdAt", "DESC"]],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    const formattedRooms = rooms.map((r) => {
      const plain = r.toJSON();
      const msgs = plain.ChatMessages || [];
      const latest = msgs[0] || null;
      const unreadCount = msgs.filter((m) => !m.is_read && m.sender_id !== adminId).length;
      return {
        id: plain.id,
        user_id: plain.user_id,
        User: plain.User,
        last_message: latest?.message || "Belum ada pesan",
        last_message_at: latest?.createdAt || plain.updatedAt,
        unread_count: unreadCount,
        total_messages: msgs.length,
        updatedAt: plain.updatedAt,
      };
    });

    return res.status(200).json({
      status: "success",
      data: formattedRooms,
    });
  } catch (error) {
    next(error);
  }
};
