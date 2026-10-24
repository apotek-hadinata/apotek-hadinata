# 📋 Product Requirement Document (PRD): Sistem Apotek Hadinata Digital

* **Project Name:** Pengembangan Sistem Apotek Digital Terintegrasi pada Apotek Hadinata
* **Tech Stack Backend:** Node.js (Express v5), MySQL (Sequelize ORM), JWT Auth, Midtrans Snap SDK
* **Target Frontend Architecture:** Single Page Application (React / Next.js / Vite SPA) dengan Tailwind CSS / Vanilla CSS, REST API Client, State Management, Role-Based Access Control.
* **Document Version:** 1.0.0
* **Date:** Oktober 2026

---

## 1. Executive Summary & Goals

Aplikasi ini bertujuan untuk mendigitalkan proses bisnis Apotek Hadinata yang sebelumnya sepenuhnya manual/offline. Sistem ini memfasilitasi tiga aktor utama:
1. **Pelanggan (User):** Menjelajahi katalog obat non-resep, melihat kepastian stok online, mengelola keranjang, melakukan checkout (Midtrans / COD), berkonsultasi via live chat CS, dan memantau status pesanan.
2. **Admin (Owner / Apoteker / Kasir):** Mengelola master data obat & kategori, mengontrol stok kloter batch dengan algoritma **FEFO (*First Expire First Out*)**, menjalankan kasir POS transaksi offline langsung, memproses pesanan online, dan melayani chat konsultasi.
3. **Kurir Internal:** Mengambil tugas pengiriman (*pickup job*), mengantar obat ke alamat pelanggan, dan memperbarui status pengantaran (*in_transit*, *delivered*, *failed*).

---

## 2. User Roles & Permission Matrix

| Modul / Fitur | Public / Guest | Pelanggan (`user`) | Admin (`admin`) | Kurir (`kurir`) |
| :--- | :---: | :---: | :---: | :---: |
| Katalog & Pencarian Obat | ✅ | ✅ | ✅ | ❌ |
| Registrasi & Login | ✅ | ✅ | ✅ | ✅ |
| Keranjang Belanja | ❌ | ✅ | ❌ | ❌ |
| Checkout Pemesanan Online | ❌ | ✅ | ❌ | ❌ |
| Riwayat Pesanan Saya | ❌ | ✅ | ❌ | ❌ |
| Live Chat CS / Konsultasi | ❌ | ✅ (Chat ke CS) | ✅ (Balas Pelanggan) | ❌ |
| Manajemen Obat & Kategori | ❌ | ❌ | ✅ | ❌ |
| Manajemen Batch Stok Online (FEFO) | ❌ | ❌ | ✅ | ❌ |
| Manajemen & ACC Pesanan Online | ❌ | ❌ | ✅ | ❌ |
| Pool Tugas Pengiriman (*Jobs*) | ❌ | ❌ | ❌ | ✅ |
| Update Status Pengiriman | ❌ | ❌ | ❌ | ✅ |
| Notifikasi Sistem | ❌ | ✅ | ✅ | ✅ |

---

## 3. Rencana Pengembangan Bertahap (Sprint Roadmap)

* **Sprint 1: Foundation, Auth & Layout Shell**
* **Sprint 2: Master Data Obat & Manajemen Batch FEFO Online (Admin)**
* **Sprint 3: Katalog, Filter, & Keranjang Belanja (Pelanggan)**
* **Sprint 4: Checkout Pemesanan Online & Manajemen ACC Pesanan (Admin & Pelanggan)**
* **Sprint 5: Logistik Pengiriman & Portal Kurir**
* **Sprint 6: Live Chat CS & Notifikasi Sistem**

---

## 4. Rincian Spesifikasi Fitur per Modul

### 📌 Modul 1: Autentikasi, Profil & Layout Shell (Sprint 1)
* **Tujuan:** Pondasi sistem, penanganan JWT token, proteksi rute halaman (*route guard*), dan navigasi antarmuka berdasarkan role.
* **Backend Endpoint Terkait:**
  * `POST /api/auth/register` (Registrasi akun baru)
  * `POST /api/auth/login` (Login & perolehan JWT)
  * `GET /api/auth/profile` (Ambil identitas profil)
  * `PUT /api/auth/profile` (Update nama, nomor HP, alamat)
* **Kebutuhan Frontend:**
  * Halaman Login & Register responsif (validasi email & minimal 6 karakter password).
  * Storage Service: Penyimpanan token JWT di `localStorage` dengan auto header inject pada request API.
  * Role-based Redirect:
    * `user` ➔ Halaman Home / Katalog Obat
    * `admin` ➔ Dashboard Penjualan & Inventory
    * `kurir` ➔ Antrean Pengiriman (*Job Board*)
  * Halaman Profil & Edit Alamat / Nomor Telepon.

---

### 📌 Modul 2: Master Data Obat & Manajemen Batch FEFO (Sprint 2 - Admin)
* **Tujuan:** Admin dapat mengelola kategori obat, produk obat, dan batch masa kedaluwarsa sesuai logika FEFO backend.
* **Backend Endpoint Terkait:**
  * `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`
  * `GET /api/medicines`, `GET /api/medicines/:id`, `POST /api/medicines`, `PUT /api/medicines/:id`, `DELETE /api/medicines/:id`
  * `POST /api/medicines/batches` (Tambah batch: nomor kloter, tanggal kedaluwarsa, kuantitas stok)
  * `PUT /api/medicines/batches/:batchId`, `DELETE /api/medicines/batches/:batchId`
* **Kebutuhan Frontend:**
  * **Halaman Kategori Obat:** Tabel kategori dengan modal Tambah/Edit.
  * **Halaman Master Obat:**
    * Daftar obat (foto, nama obat, kategori, SKU, harga, status ketersediaan, total stok akumulatif dari seluruh batch).
    * Modal/Form Tambah & Edit Obat (upload file gambar produk).
  * **Sub-Halaman / Detail Batch & Kadaluwarsa:**
    * Menampilkan daftar kloter stok per obat: Nomor Batch, Tanggal Expired, Sisa Stok.
    * Indikator warna / badge status kadaluwarsa (Merah: < 30 hari / sudah lewat, Kuning: < 90 hari, Hijau: Aman).
    * Menambah batch baru dan mengedit stok batch.

---

### 📌 Modul 3: Katalog, Pencarian & Keranjang Belanja (Sprint 3 - Pelanggan)
* **Tujuan:** Pengalaman belanja pengguna yang intuitif untuk mencari dan mengumpulkan obat non-resep ke keranjang.
* **Backend Endpoint Terkait:**
  * `GET /api/medicines?search=&category_id=`
  * `GET /api/medicines/:id`
  * `POST /api/cart` (Tambah obat ke keranjang)
  * `GET /api/cart` (Ambil isi keranjang aktif)
  * `PUT /api/cart/:id` (Ubah kuantitas beli)
  * `DELETE /api/cart/:id` (Hapus item dari keranjang)
  * `DELETE /api/cart` (Kosongkan keranjang)
* **Kebutuhan Frontend:**
  * **Halaman Katalog:** Grid obat dengan thumbnail, nama, kategori, harga, dan badge stok realtime.
  * **Filter & Search Bar:** Filter kategori instan, pencarian nama obat secara langsung (*debounced input*).
  * **Modal / Drawer Detail Obat:** Deskripsi khasiat, aturan pakai, dan tombol "Tambah ke Keranjang".
  * **Halaman / Drawer Keranjang:**
    * Counter kuantitas (+/-) dengan validasi otomatis terhadap sisa stok obat di backend.
    * Perhitungan subtotal harga produk otomatis.
    * Tombol navigasi menuju Checkout.

---

### 📌 Modul 4: Checkout Pemesanan Online & Manajemen Pesanan (Sprint 4)
* **Tujuan:** Eksekusi transaksi pemesanan online pelanggan (dengan metode COD / Transfer Midtrans) yang memicu pemotongan stok berdasar algoritma FEFO di backend, serta pengelolaan persetujuan (approval/ACC) pesanan oleh Admin.
* **Backend Endpoint Terkait:**
  * `POST /api/checkout/online` (Items, ongkir, alamat, koordinat lat/long ➔ Response Midtrans Snap `redirect_url` / Order dibuat)
  * `GET /api/orders/my-history` (Riwayat pesanan pelanggan)
  * `GET /api/orders` (Semua pesanan untuk admin)
  * `GET /api/orders/:id` (Detail nota pesanan)
  * `PUT /api/orders/:id/status` (Admin mengubah status pesanan: `processing`, `completed`, `cancelled`)
* **Kebutuhan Frontend:**
  * **A. Alur Checkout Online (Pelanggan):**
    * Konfirmasi alamat kirim & input rincian catatan pengantaran.
    * Pemilihan metode pembayaran (COD / Transfer Payment Gateway Midtrans).
    * Ringkasan biaya obat + ongkir pengantaran kurir internal.
    * Halaman Berhasil / Status Pembayaran (`pending`, `paid`).
  * **B. Manajemen & Persetujuan Pesanan (Admin):**
    * Dashboard antrean pesanan online masuk (tab status: `pending`, `processing`, `completed`, `cancelled`).
    * Tombol aksi Admin: "Persetujuan / ACC Pesanan", "Siapkan untuk Dikirim", atau "Batalkan Pesanan".
    * Detail nota pesanan (data pelanggan, alamat antar, rincian obat, dan status bayar).

---

### 📌 Modul 5: Logistik Pengiriman & Portal Kurir (Sprint 5)
* **Tujuan:** Memfasilitasi kurir internal apotek dalam mengambil tugas pengiriman dan mengabari status antar kepada pembeli.
* **Backend Endpoint Terkait:**
  * `GET /api/shipping/jobs` (Melihat pesanan yang siap diantar: status shipping `pending` & order `processing`)
  * `GET /api/shipping/my-shipments` (Daftar kiriman aktif & riwayat kurir)
  * `PUT /api/shipping/:id/pickup` (Kurir mengambil pekerjaan antar)
  * `PUT /api/shipping/:id/status` (Update status: `in_transit`, `delivered`, `failed`)
* **Kebutuhan Frontend:**
  * **Dashboard Kurir (Mobile-friendly layout):**
    * Tab "Tugas Tersedia": Kartu alamat penerima, nama pelanggan, kontak telepon (link langsung ke WhatsApp / telp), dan tombol "Ambil Tugas".
    * Tab "Sedang Diantar": Tombol "Buka di Google Maps" (navigasi koordinat), tombol "Selesaikan Pengantaran (Delivered)", atau "Pengantaran Gagal (Failed)".
    * Tab "Riwayat Antar": Rekap seluruh paket yang telah sukses dikirim.

---

### 📌 Modul 6: Layanan Live Chat CS & Notifikasi Realtime (Sprint 6)
* **Tujuan:** Saluran komunikasi langsung antara pelanggan dan apoteker untuk konsultasi obat non-resep serta pusat informasi status pesanan.
* **Backend Endpoint Terkait:**
  * `POST /api/chats/message` (Kirim pesan)
  * `GET /api/chats/history` (Riwayat chat pelanggan)
  * `GET /api/chats/admin/rooms` (Daftar room chat pelanggan untuk admin)
  * `GET /api/chats/admin/history/:roomId` (Admin membuka room chat spesifik)
  * `GET /api/notifications` (Daftar notifikasi akun)
  * `PUT /api/notifications/:id/read` & `PUT /api/notifications/read-all`
* **Kebutuhan Frontend:**
  * **Widget / Halaman Chat Pelanggan:** Bubble chat interaktif, auto-scroll ke pesan terbaru, indikator pengirim (*Pelanggan vs CS*).
  * **Chat Console Admin:** Panel daftar percakapan aktif di sebelah kiri dan jendela chat aktif di sebelah kanan.
  * **Dropdown / Lonceng Notifikasi:** Badge merah angka belum dibaca, list notifikasi (misal: "Pesanan #123 sedang diantar oleh kurir"), dan tombol "Tandai Semua Telah Dibaca".

---

## 5. Non-Functional Requirements (NFR)

1. **Responsiveness:** Tampilan harus optimal pada layar Smartphone (360px+) untuk Pelanggan & Kurir, serta nyaman di Tablet/Desktop untuk Admin & Kasir POS.
2. **Error Handling & Feedback:** Notifikasi toast / popup interaktif untuk setiap respon sukses/gagal dari backend.
3. **Data Integrity & FEFO Compliance:** Tidak memperbolehkan kuantitas melebihi stok total obat yang valid.
4. **Security:** Token JWT disimpan dengan aman; rute terproteksi menolak akses pengguna tanpa otorisasi role yang sesuai.
