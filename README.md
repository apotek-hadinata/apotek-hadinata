# Sistem Informasi & Operasional Apotek Hadinata (Capstone Project)

Sistem Digital Terintegrasi Apotek Hadinata untuk manajemen sediaan obat berbasis **FEFO (First Expired First Out)**, kasir gerai (*Point of Sale*), e-commerce obat resmi berklasifikasi BPOM, logistik kurir internal berbasis GPS, serta layanan konsultasi apoteker dua arah.

---

## Struktur Proyek (Monorepo)

```text
├── backend/                  # RESTful API Engine (Node.js, Express v5, Sequelize, MySQL)
│   ├── config/               # Konfigurasi database & payment gateway (Midtrans Snap)
│   ├── controllers/          # Logika bisnis endpoint (auth, medicine, cart, order, shipping, chat)
│   ├── middleware/           # Proteksi rute JWT, RBAC, validasi input & upload gambar (Multer)
│   ├── migrations/           # 21 Migrasi database resmi Sequelize
│   ├── models/               # Model data Sequelize (20 entitas relasional)
│   ├── routes/               # Definisi routing API (/api/*)
│   ├── seeders/              # Seeder idempoten (3 akun demo, 16 obat BPOM, multi-kloter FEFO)
│   ├── uploads/medicines/    # Penyimpanan lokal foto kemasan obat
│   └── API_DOCS.md           # Dokumentasi spesifikasi kontrak REST API lengkap
├── frontend/                 # Web Application Client (React 19, Vite, Custom CSS Marketplace)
│   ├── src/components/       # Komponen antarmuka (Navbar K24-style, Notifikasi, Navigasi Peran)
│   ├── src/context/          # State management autentikasi JWT (AuthContext)
│   ├── src/pages/            # Katalog Pelanggan, Keranjang+GPS, Pesanan, Admin FEFO, Kasir POS, Kurir
│   ├── src/services/         # Klien HTTP API terpusat
│   └── src/utils/            # Utilitas cetak Nota Invoice A5 & Struk Thermal POS 80mm
├── PRD_APOTEK_HADINATA.md    # Product Requirement Document (Spesifikasi Lengkap)
└── README.md                 # Panduan utama proyek
```

---

## Fitur Utama Sistem

1. **Manajemen Inventori & Audit Mutasi FEFO (`First Expired First Out`):**
   - Pemotongan stok otomatis memprioritaskan kloter (*batch*) aktif dengan tanggal kedaluwarsa terdekat serta memblokir kloter yang sudah kedaluwarsa.
   - Pencatatan jejak audit lengkap di tabel `StockLogs` & `OrderItemBatches` (`stock_in`, `stock_out`, `adjustment`, `release_reservation`) beserta fitur **Export CSV**.
   - Upload foto kemasan obat langsung dari perangkat Admin (`JPG/PNG/WEBP/GIF`, maks. 4 MB).
2. **Marketplace Obat Pelanggan & Validasi Stok Real-Time:**
   - Katalog padat bergaya apotek modern lengkap dengan penanda golongan obat BPOM (Obat Bebas, Bebas Terbatas, Suplemen), filter kategori, pencarian instan, dan transparansi nomor batch + tanggal ED.
   - Validasi batas sisa stok otomatis di keranjang belanja, deteksi koordinat **GPS Browser (Haversine)** ke Gerai Apotek Hadinata, serta bebas ongkir otomatis di atas Rp 150.000.
3. **Pembayaran Midtrans Snap, COD & Verifikasi Lokal Tanpa `ngrok`:**
   - Mendukung pembayaran digital (Midtrans Snap QRIS / Virtual Account) maupun Bayar di Tempat (*Cash on Delivery*).
   - Dilengkapi endpoint `POST /api/orders/:id/verify-payment` (*Cek Status Bayar* & *Simulasi Lunas Sandbox*) sehingga pengujian di `localhost` berjalan penuh tanpa tunnel eksternal.
4. **Kasir Gerai Offline (*Point of Sale*) & Cetak Nota:**
   - Antarmuka kasir cepat untuk transaksi *walk-in*, kalkulasi kembalian tunai otomatis, pemotongan kloter FEFO langsung, serta cetak **Struk Thermal 80mm** & **Faktur Pembelian**.
5. **Logistik Kurir Internal & Konsultasi Live Chat Apoteker:**
   - Portal khusus Kurir untuk *pickup* antrean paket siap antar, navigasi peta Google Maps berdasarkan titik GPS pelanggan, konfirmasi *delivered*, serta pengembalian stok FEFO otomatis bila pengantaran gagal (*failed*).
   - Ruang konsultasi dua arah antara pelanggan dan Apoteker Jaga untuk tanya jawab dosis dan keluhan.

---

## Panduan Instalasi & Menjalankan Proyek

Pastikan **Node.js (v18+)** dan **MySQL Server** sudah berjalan di komputer Anda.

### 1. Menjalankan Backend API (Terminal 1)
```bash
cd backend
npm install
cp .env.example .env
# Sesuaikan DB_USER, DB_PASS, DB_NAME, JWT_SECRET, dan kunci Midtrans Sandbox pada file .env

# Buat database, jalankan 21 tabel migrasi, dan isi data awal (seeder)
npm run db:create
npm run db:migrate
npm run db:seed

# Jalankan pengujian integrasi otomatis 6 modul PRD (opsional)
npm test

# Jalankan server API di http://localhost:3000
npm run dev
```

### 2. Menjalankan Frontend Web (Terminal 2)
```bash
cd frontend
npm install

# Jalankan Vite dev server di http://localhost:5173
npm run dev
```

Buka browser dan akses `http://localhost:5173`.

---

## Akun Demo Siap Pakai (Hasil `npm run db:seed`)

| Peran Sistem | Email Login | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Admin / Apoteker** | `admin@apotekhadinata.com` | `password123` | Dashboard omzet, master obat & batch FEFO, upload foto, Kasir POS, ACC pesanan, balas chat, export CSV |
| **Pelanggan** | `budi@gmail.com` | `password123` | Belanja katalog obat, keranjang + GPS checkout, bayar Midtrans / COD, cetak nota, chat apoteker |
| **Kurir Internal** | `kurir@apotekhadinata.com` | `password123` | Ambil tugas pengantaran (*pickup*), buka rute GPS Maps, update status *delivered* / *failed* |
