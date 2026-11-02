"use strict";

const crypto = require("crypto");
const { Order, Payment } = require("../models");
const { restockOrderFefo } = require("../utils/fefoRestock");

exports.handleMidtransNotification = async (req, res, next) => {
  try {
    const statusResponse = req.body;

    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    const midtransOrderId = statusResponse.order_id; // Format: ORDER-{id}-{timestamp}

    // 1. Validasi SHA-512 Signature Key Resmi Midtrans (bila Server Key tersedia di konfigurasi)
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (serverKey && statusResponse.signature_key && statusResponse.status_code && statusResponse.gross_amount) {
      const payloadString = `${midtransOrderId}${statusResponse.status_code}${statusResponse.gross_amount}${serverKey}`;
      const calculatedSignature = crypto.createHash("sha512").update(payloadString).digest("hex");

      if (calculatedSignature !== statusResponse.signature_key) {
        return res.status(401).json({ message: "Signature key Midtrans tidak valid." });
      }
    }

    // Ekstrak ID asli dari database MySQL
    const dbOrderId = midtransOrderId?.split("-")?.[1];
    if (!dbOrderId) {
      return res.status(400).json({ message: "Format Order ID Midtrans tidak valid." });
    }

    const order = await Order.findByPk(dbOrderId);
    const payment = await Payment.findOne({ where: { transaction_reference: midtransOrderId } });

    if (!order || !payment) {
      return res.status(404).json({ message: "Data transaksi tidak ditemukan di sistem internal." });
    }

    // 2. Logika Penentuan Status dari Payment Gateway Midtrans
    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      // Pembayaran Sukses / Lunas
      if (fraudStatus === "challenge") {
        await order.update({ payment_status: "unpaid", order_status: "pending_payment" });
      } else {
        await order.update({ payment_status: "paid", order_status: "processing" });
        await payment.update({ payment_status: "success", raw_response: JSON.stringify(statusResponse) });
      }
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      // Pembayaran Gagal / Kedaluwarsa -> Batalkan dan kembalikan stok obat ke kloter FEFO
      const wasActive = order.order_status !== "cancelled" && order.order_status !== "completed";

      await order.update({ payment_status: "failed", order_status: "cancelled" });
      await payment.update({ payment_status: "failed", raw_response: JSON.stringify(statusResponse) });

      if (wasActive) {
        await restockOrderFefo({
          orderId: order.id,
          notePrefix: `Restock otomatis webhook Midtrans (${transactionStatus})`,
        });
      }
    }

    return res.status(200).json({ status: "OK", message: "Webhook Midtrans berhasil diproses." });
  } catch (error) {
    next(error);
  }
};
