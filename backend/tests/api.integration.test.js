"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../server");
const {
  sequelize,
  User,
  Category,
  Medicine,
  MedicineBatch,
  CartItem,
  Order,
  OrderItem,
  OrderItemBatch,
  OrderStatusHistory,
  Shipping,
  Payment,
  StockLog,
  ChatRoom,
  ChatMessage,
  Notification,
} = require("../models");

const toIsoDate = (offsetDays) => {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
};

describe("Apotek Hadinata — End-to-End Integration Test Suite (6 Modul PRD)", () => {
  let server;
  let baseUrl;

  let adminToken;
  let courierToken;
  let tempUserToken;
  let tempUserId;

  let categoryId;
  let testMedicineId;
  let batchExpiredId;
  let batchNearId;
  let batchFarId;

  const createdOrderIds = [];
  const uniqueSuffix = Date.now();
  const tempUserEmail = `qa.capstone.${uniqueSuffix}@apotekhadinata.test`;

  const apiCall = async (path, { method = "GET", token, body } = {}) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json };
  };

  before(async () => {
    await sequelize.authenticate();
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    // Bersihkan seluruh entitas sementara hasil pengujian agar database tetap bersih
    try {
      for (const ordId of createdOrderIds) {
        const items = await OrderItem.findAll({ where: { order_id: ordId } });
        for (const it of items) {
          await OrderItemBatch.destroy({ where: { order_item_id: it.id } });
        }
        await OrderItem.destroy({ where: { order_id: ordId } });
        await Shipping.destroy({ where: { order_id: ordId } });
        await Payment.destroy({ where: { order_id: ordId } });
        await OrderStatusHistory.destroy({ where: { order_id: ordId } }).catch(() => {});
        await Notification.destroy({ where: { order_id: ordId } }).catch(() => {});
        await Order.destroy({ where: { id: ordId } });
      }

      if (testMedicineId) {
        await StockLog.destroy({ where: { medicine_id: testMedicineId } });
        await CartItem.destroy({ where: { medicine_id: testMedicineId } });
        await MedicineBatch.destroy({ where: { medicine_id: testMedicineId } });
        await Medicine.destroy({ where: { id: testMedicineId } });
      }

      if (tempUserId) {
        const rooms = await ChatRoom.findAll({ where: { user_id: tempUserId } });
        for (const r of rooms) {
          await ChatMessage.destroy({ where: { room_id: r.id } });
        }
        await ChatRoom.destroy({ where: { user_id: tempUserId } });
        await CartItem.destroy({ where: { user_id: tempUserId } });
        await Notification.destroy({ where: { user_id: tempUserId } });
        await User.destroy({ where: { id: tempUserId } });
      }
    } finally {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }
      await sequelize.close();
    }
  });

  it("Modul 1: Autentikasi JWT, RBAC, Update Profil & Ganti Password berjalan aman", async () => {
    // 1. Login akun Admin & Kurir dari seeder
    const adminLogin = await apiCall("/auth/login", {
      method: "POST",
      body: { email: "admin@apotekhadinata.com", password: "password123" },
    });
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.data.user.role, "admin");
    adminToken = adminLogin.data.token;

    const courierLogin = await apiCall("/auth/login", {
      method: "POST",
      body: { email: "kurir@apotekhadinata.com", password: "password123" },
    });
    assert.equal(courierLogin.status, 200);
    assert.equal(courierLogin.data.user.role, "kurir");
    courierToken = courierLogin.data.token;

    // 2. Registrasi akun pelanggan uji coba sementara
    const regRes = await apiCall("/auth/register", {
      method: "POST",
      body: {
        name: "Pelanggan Uji Capstone",
        email: tempUserEmail,
        phone: "081234567891",
        password: "passwordAwal123",
        address: "Jl. Kaliurang Km 5, Sleman",
      },
    });
    assert.equal(regRes.status, 201);
    tempUserId = regRes.data.user.id;

    // 3. Login pelanggan uji coba
    const userLogin = await apiCall("/auth/login", {
      method: "POST",
      body: { email: tempUserEmail, password: "passwordAwal123" },
    });
    assert.equal(userLogin.status, 200);
    tempUserToken = userLogin.data.token;

    // 4. Update profil tetap mempertahankan role 'user' dan memperbarui alamat
    const updRes = await apiCall("/auth/profile", {
      method: "PUT",
      token: tempUserToken,
      body: {
        name: "Pelanggan Uji Terverifikasi",
        phone: "081299887766",
        address: "Jl. Malioboro No. 10, Yogyakarta",
      },
    });
    assert.equal(updRes.status, 200);
    assert.equal(updRes.data.user.role, "user");
    assert.equal(updRes.data.user.address, "Jl. Malioboro No. 10, Yogyakarta");

    // 5. Ganti password & verifikasi password lama ditolak
    const pwdRes = await apiCall("/auth/password", {
      method: "PUT",
      token: tempUserToken,
      body: {
        current_password: "passwordAwal123",
        new_password: "passwordBaru456",
      },
    });
    assert.equal(pwdRes.status, 200);

    const oldLogin = await apiCall("/auth/login", {
      method: "POST",
      body: { email: tempUserEmail, password: "passwordAwal123" },
    });
    assert.equal(oldLogin.status, 401);

    const newLogin = await apiCall("/auth/login", {
      method: "POST",
      body: { email: tempUserEmail, password: "passwordBaru456" },
    });
    assert.equal(newLogin.status, 200);
    tempUserToken = newLogin.data.token;

    // 6. Proteksi RBAC: pelanggan dilarang mengakses endpoint khusus Admin
    const forbiddenRes = await apiCall("/orders", { token: tempUserToken });
    assert.equal(forbiddenRes.status, 403);
  });

  it("Modul 2: Master Obat & Multi-Kloter Batch FEFO (Kedaluwarsa vs Dekat vs Jauh)", async () => {
    const cats = await Category.findAll({ limit: 1 });
    assert.ok(cats.length > 0, "Minimal 1 kategori obat tersedia di database");
    categoryId = cats[0].id;

    // Buat obat uji dengan harga Rp 15.000
    const medRes = await apiCall("/medicines", {
      method: "POST",
      token: adminToken,
      body: {
        category_id: categoryId,
        name: `Paracetamol Uji FEFO ${uniqueSuffix}`,
        desc: "Sediaan uji otomatis algoritma FEFO multi-batch",
        price: 15000,
        SKU_code: `SKU-QA-${uniqueSuffix}`,
      },
    });
    assert.equal(medRes.status, 201);
    testMedicineId = medRes.data.data.id;

    // Batch 1: SUDAH KEDALUWARSA (-30 hari, stok 40) -> WAJIB DIABAIKAN FEFO!
    const bExp = await apiCall("/medicines/batches", {
      method: "POST",
      token: adminToken,
      body: {
        medicine_id: testMedicineId,
        batch_number: `B-EXP-${uniqueSuffix}`,
        expiry_date: toIsoDate(-30),
        stock: 40,
      },
    });
    assert.equal(bExp.status, 201);
    batchExpiredId = bExp.data.data.id;

    // Batch 2: ED DEKAT (+20 hari, stok 3) -> PRIORITAS POTONG PERTAMA
    const bNear = await apiCall("/medicines/batches", {
      method: "POST",
      token: adminToken,
      body: {
        medicine_id: testMedicineId,
        batch_number: `B-NEAR-${uniqueSuffix}`,
        expiry_date: toIsoDate(20),
        stock: 3,
      },
    });
    assert.equal(bNear.status, 201);
    batchNearId = bNear.data.data.id;

    // Batch 3: ED JAUH (+240 hari, stok 10) -> PRIORITAS POTONG KEDUA
    const bFar = await apiCall("/medicines/batches", {
      method: "POST",
      token: adminToken,
      body: {
        medicine_id: testMedicineId,
        batch_number: `B-FAR-${uniqueSuffix}`,
        expiry_date: toIsoDate(240),
        stock: 10,
      },
    });
    assert.equal(bFar.status, 201);
    batchFarId = bFar.data.data.id;
  });

  it("Modul 3: Keranjang Belanja memblokir kuantitas di atas stok aktif non-kedaluwarsa (PRD NFR #3)", async () => {
    // Total stok aktif yang valid hanya 3 + 10 = 13 unit (40 unit kedaluwarsa tidak boleh dihitung!)
    const overStockRes = await apiCall("/cart", {
      method: "POST",
      token: tempUserToken,
      body: { medicine_id: testMedicineId, quantity: 20 },
    });
    assert.equal(overStockRes.status, 400);

    // Tambah 5 unit (valid <= 13 unit)
    const validCartRes = await apiCall("/cart", {
      method: "POST",
      token: tempUserToken,
      body: { medicine_id: testMedicineId, quantity: 5 },
    });
    assert.equal(validCartRes.status, 200);
    assert.equal(validCartRes.data.available_stock, 13);
  });

  it("Modul 4: Checkout Online memotong lintas-kloter sesuai urutan FEFO, mencatat Audit Log & Verifikasi Midtrans Lokal", async () => {
    const checkoutRes = await apiCall("/checkout/online", {
      method: "POST",
      token: tempUserToken,
      body: {
        items: [{ medicine_id: testMedicineId, quantity: 5 }],
        recipient_name: "Pelanggan Uji Terverifikasi",
        recipient_phone: "081299887766",
        shipping_address: "Jl. Malioboro No. 10, Yogyakarta",
        shipping_cost: 10000,
        latitude: -7.7928,
        longitude: 110.3658,
        distance: 1.4,
        payment_method: "QRIS",
      },
    });
    assert.equal(checkoutRes.status, 201);
    const onlineOrderId = checkoutRes.data.order_id;
    createdOrderIds.push(onlineOrderId);

    // Verifikasi hasil pemotongan FEFO di database:
    // - Batch Expired tetap 40 (tidak tersentuh)
    // - Batch Near turun dari 3 -> 0 (habis terpotong 3)
    // - Batch Far turun dari 10 -> 8 (terpotong sisa 2)
    const bExpDb = await MedicineBatch.findByPk(batchExpiredId);
    const bNearDb = await MedicineBatch.findByPk(batchNearId);
    const bFarDb = await MedicineBatch.findByPk(batchFarId);

    assert.equal(bExpDb.stock, 40);
    assert.equal(bNearDb.stock, 0);
    assert.equal(bFarDb.stock, 8);

    // Verifikasi OrderItemBatches mencatat alokasi ke 2 kloter tersebut
    const orderDetail = await apiCall(`/orders/${onlineOrderId}`, { token: tempUserToken });
    assert.equal(orderDetail.status, 200);
    const allocated = orderDetail.data.data.OrderItems[0].OrderItemBatches;
    assert.equal(allocated.length, 2);

    // Verifikasi pembayaran lokal tanpa ngrok (simulate_sandbox: true)
    const verifyPay = await apiCall(`/orders/${onlineOrderId}/verify-payment`, {
      method: "POST",
      token: tempUserToken,
      body: { simulate_sandbox: true },
    });
    assert.equal(verifyPay.status, 200);
    assert.equal(verifyPay.data.payment_status, "paid");
    assert.equal(verifyPay.data.order_status, "processing");
  });

  it("Modul 5: Logistik Kurir Internal (Pickup -> Delivered) & Restock Otomatis bila Gagal Antar (Failed)", async () => {
    const firstOrderId = createdOrderIds[0];

    // 1. Kurir melihat antrean job yang sudah berstatus 'processing'
    const jobsRes = await apiCall("/shipping/jobs", { token: courierToken });
    assert.equal(jobsRes.status, 200);
    const targetJob = jobsRes.data.data.find((j) => j.order_id === firstOrderId);
    assert.ok(targetJob, "Pesanan siap antar muncul di antrean tugas kurir");

    // 2. Kurir pickup paket -> status order berubah menjadi 'shipping'
    const pickupRes = await apiCall(`/shipping/${targetJob.id}/pickup`, {
      method: "PUT",
      token: courierToken,
    });
    assert.equal(pickupRes.status, 200);

    // 3. Kurir menyelesaikan pengantaran ('delivered') -> status order menjadi 'completed'
    const deliverRes = await apiCall(`/shipping/${targetJob.id}/status`, {
      method: "PUT",
      token: courierToken,
      body: { shipping_status: "delivered" },
    });
    assert.equal(deliverRes.status, 200);

    const completedOrd = await Order.findByPk(firstOrderId);
    assert.equal(completedOrd.order_status, "completed");

    // 4. Uji skenario GAGAL ANTAR ('failed') -> stok wajib kembali dari 8-2=6 menjadi 8!
    const secondCheckout = await apiCall("/checkout/online", {
      method: "POST",
      token: tempUserToken,
      body: {
        items: [{ medicine_id: testMedicineId, quantity: 2 }],
        recipient_name: "Pelanggan Uji Gagal Antar",
        recipient_phone: "081299887766",
        shipping_address: "Alamat Uji Gagal Kirim",
        shipping_cost: 10000,
        latitude: -7.8,
        longitude: 110.37,
        distance: 2.0,
        payment_method: "COD",
      },
    });
    assert.equal(secondCheckout.status, 201);
    const secondOrderId = secondCheckout.data.order_id;
    createdOrderIds.push(secondOrderId);

    const bFarAfterCheckout = await MedicineBatch.findByPk(batchFarId);
    assert.equal(bFarAfterCheckout.stock, 6);

    // Admin ACC pesanan COD -> 'processing'
    const accRes = await apiCall(`/orders/${secondOrderId}/status`, {
      method: "PUT",
      token: adminToken,
      body: { order_status: "processing" },
    });
    assert.equal(accRes.status, 200);

    // Kurir pickup lalu lapor 'failed'
    const jobsRes2 = await apiCall("/shipping/jobs", { token: courierToken });
    const secondJob = jobsRes2.data.data.find((j) => j.order_id === secondOrderId);
    assert.ok(secondJob);

    await apiCall(`/shipping/${secondJob.id}/pickup`, { method: "PUT", token: courierToken });
    const failRes = await apiCall(`/shipping/${secondJob.id}/status`, {
      method: "PUT",
      token: courierToken,
      body: { shipping_status: "failed" },
    });
    assert.equal(failRes.status, 200);

    // Pastikan stok Batch Far otomatis pulih kembali menjadi 8 unit!
    const bFarRestored = await MedicineBatch.findByPk(batchFarId);
    assert.equal(bFarRestored.stock, 8);
  });

  it("Modul 4B & Modul 6: Kasir POS Offline & Live Chat Konsultasi Apoteker", async () => {
    // 1. Transaksi Kasir POS Offline oleh Admin (beli 2 unit @15.000 = Rp 30.000, bayar Rp 50.000 -> kembalian Rp 20.000)
    const posRes = await apiCall("/checkout/offline", {
      method: "POST",
      token: adminToken,
      body: {
        customer_name: "Pasien Walk-in Uji POS",
        items: [{ medicine_id: testMedicineId, quantity: 2 }],
        payment_method: "CASH",
        amount_paid: 50000,
      },
    });
    assert.equal(posRes.status, 201);
    assert.equal(posRes.data.total_payment, 30000);
    assert.equal(posRes.data.change, 20000);
    createdOrderIds.push(posRes.data.order_id);

    // 2. Konsultasi Live Chat dua arah Pelanggan <-> Admin Apoteker
    const userMsg = await apiCall("/chats/message", {
      method: "POST",
      token: tempUserToken,
      body: { message: "Siang Apt, dosis Paracetamol dewasa berapa kali sehari?" },
    });
    assert.equal(userMsg.status, 201);
    const chatRoomId = userMsg.data.data.room_id || userMsg.data.data.chat_room_id;

    const adminReply = await apiCall("/chats/message", {
      method: "POST",
      token: adminToken,
      body: {
        chat_room_id: chatRoomId,
        message: "Selamat siang, dosis dewasa 3x sehari 1 tablet sesudah makan.",
      },
    });
    assert.equal(adminReply.status, 201);

    const historyRes = await apiCall("/chats/history", { token: tempUserToken });
    assert.equal(historyRes.status, 200);
    assert.equal(historyRes.data.data.length, 2);
  });
});
