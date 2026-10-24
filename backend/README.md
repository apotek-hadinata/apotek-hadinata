# 🚀 Apotek Hadinata - Backend API Engine

Backend RESTful API untuk Sistem Informasi & Operasional Apotek Hadinata berbasis Node.js, Express, dan Sequelize ORM dengan MySQL.

---

## 🛠️ Panduan Setup Cepat untuk Anggota Tim

Saat anggota tim baru membagi tugas atau melakukan clone project di komputernya masing-masing, cukup ikuti langkah mudah berikut:

### 1. Masuk ke folder backend & Install Dependencies
```bash
cd backend
npm install
```

### 2. Salin dan Sesuaikan File Environment
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
> **Catatan:** Buka file `.env` dan sesuaikan `DB_PASSWORD` dengan password MySQL di komputer masing-masing jika ada (default XAMPP biasanya kosong).

### 3. Buat Database & Jalankan Migrasi
Jalankan perintah otomatis berikut untuk membuat database dan 20 tabel lengkap:
```bash
# Membuat database 'apotek' (jika belum ada)
npm run db:create

# Menjalankan seluruh migrasi database
npm run db:migrate
```

### 4. Jalankan Server Backend
```bash
# Menjalankan server dalam mode hot-reload
npm run dev

# Atau menjalankan mode standar
npm start
```
Server akan aktif di: `http://localhost:3000`

---

## 📋 Daftar Script NPM yang Tersedia

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server dengan fitur hot-reload bawaan Node (`--watch`) |
| `npm start` | Menjalankan server biasa (`node server.js`) |
| `npm run db:create` | Membuat database MySQL sesuai konfigurasi di `.env` |
| `npm run db:migrate` | Menjalankan seluruh file migrasi yang belum terpasang |
| `npm run db:migrate:status` | Memeriksa status file migrasi mana yang sudah / belum berjalan |
| `npm run db:migrate:undo` | Me-rollback migrasi terakhir |
| `npm run db:reset` | Me-reset seluruh tabel dari awal (rollback all + re-migrate) |

---

## 🗄️ Struktur Tabel Database (20 Tabel)

Backend ini menggunakan migrasi Sequelize resmi di folder `migrations/`:
1. `Users` (Role: `admin`, `user`, `kurir`)
2. `Categories`
3. `Medicines` (Dilengkapi `status` dan `is_active`)
4. `MedicineBatches` (Dilengkapi `reserved_stock` untuk FEFO)
5. `CartItems`
6. `Orders` (Dilengkapi relasi kurir & detail penerima)
7. `OrderItems`
8. `Payments` (Integrasi Midtrans)
9. `Shippings` (Manajemen tugas kurir internal)
10. `DeliveryBatches` (Kloter pengiriman harian)
11. `CustomerAddresses` (Buku alamat pelanggan)
12. `OrderItemBatches` (Potongan batch FEFO per item pesanan)
13. `StockLogs` (Audit trail log stok obat)
14. `OrderStatusHistory` (Timeline riwayat status order)
15. `ActivityLogs` (Log aktivitas sistem & admin)
16. `SystemSettings` (Pengaturan parameter apotek)
17. `ChatRooms` (Ruang konsultasi apoteker)
18. `ChatMessages` (Pesan konsultasi live chat)
19. `Notifications` (Notifikasi sistem)
20. `SequelizeMeta` (Catatan versi migrasi Sequelize)
