# 🏥 Sistem Informasi & Operasional Apotek Hadinata (Capstone Project)

Sistem Digital Terintegrasi Apotek Hadinata untuk manajemen obat berbasis **FEFO (First Expire First Out)**, kasir POS, pesanan online, logistik kurir internal, serta konsultasi apoteker.

---

## 🏗️ Struktur Proyek (Monorepo)

```text
├── backend/                  # RESTful API Engine (Node.js, Express, Sequelize, MySQL)
│   ├── config/               # Konfigurasi database & payment gateway (Midtrans)
│   ├── controllers/          # Logika bisnis endpoint (auth, medicine, order, shipping, dll.)
│   ├── middleware/           # Proteksi rute JWT & validasi input
│   ├── migrations/           # 21 Migrasi database resmi Sequelize
│   ├── models/               # Model data Sequelize (20 entitas)
│   └── routes/               # Definisi routing API
├── frontend/                 # Web Application Client (React, Vite, Vanilla CSS)
│   ├── src/components/       # Komponen antarmuka (Navbar, Modal, Card, dll.)
│   ├── src/context/          # State management (AuthContext)
│   ├── src/pages/            # Halaman (Dashboard Admin, Katalog, Kasir POS, Kurir, Auth)
│   └── src/services/         # API Client (Axios / Fetch)
├── PRD_APOTEK_HADINATA.md    # Product Requirement Document (Spesifikasi Lengkap)
└── README.md                 # Panduan utama proyek
```

---

## 🚀 Panduan Memulai untuk Anggota Tim

Setelah melakukan clone repository ini ke komputer masing-masing:
```bash
git clone https://github.com/apotek-hadinata/apotek-hadinata.git
cd apotek-hadinata
```

### 1. Menjalankan Backend (Terminal 1)
```bash
cd backend
npm install
cp .env.example .env

# Buat database & pasang 20 tabel otomatis
npm run db:create
npm run db:migrate

# Jalankan server API (port 3000)
npm run dev
```

### 2. Menjalankan Frontend (Terminal 2)
```bash
cd frontend
npm install

# Jalankan aplikasi web (Vite dev server)
npm run dev
```

Buka browser di alamat yang ditampilkan oleh Vite (biasanya `http://localhost:5173`).

---

## 👥 Aktor & Hak Akses Akun
Sistem ini mendukung 3 peran pengguna utama:
1. **Admin / Apoteker (`admin`):** Manajemen obat FEFO, kasir transaksi offline, konfirmasi pesanan online, konsultasi live chat.
2. **Pelanggan (`user`):** Katalog obat, keranjang belanja, checkout Midtrans / COD, riwayat transaksi.
3. **Kurir (`kurir`):** Mengambil tugas pengiriman (*pickup job*), rute antar, update status pengiriman (*in_transit*, *delivered*).
