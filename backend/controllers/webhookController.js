"use strict";
const { Order, Payment } = require("../models");

exports.handleMidtransNotification = async (req, res, next) => {
  try {
    const statusResponse = req.body;

    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    const midtransOrderId = statusResponse.order_id; // Format: ORDER-{id}-{timestamp}

    // Ekstrak ID asli dari database MySQL kamu
    const dbOrderId = midtransOrderId.split("-")[1];

    const order = await Order.findByPk(dbOrderId);
    const payment = await Payment.findOne({ where: { transaction_reference: midtransOrderId } });

    if (!order || !payment) {
      return res.status(404).json({ message: "Data transaksi tidak ditemukan di sistem internal" });
    }

    // Logika penentuan status dari Payment Gateway Midtrans
    if (transactionStatus === "settlement") {
      // Pembayaran Sukses / Lunas
      await order.update({ payment_status: "paid", order_status: "processing" });
      await payment.update({ payment_status: "success", raw_response: JSON.stringify(statusResponse) });
    } else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
      // Pembayaran Gagal / Kedaluwarsa
      await order.update({ payment_status: "unpaid", order_status: "cancelled" });
      await payment.update({ payment_status: "failed", raw_response: JSON.stringify(statusResponse) });
    }

    return res.status(200).json({ status: "OK", message: "Webhook Midtrans berhasil diproses" });
  } catch (error) {
    next(error);
  }
};
