# 📊 Dokumentasi Komprehensif Activity Diagram: Sistem Apotek Hadinata Digital (Capstone)

Dokumen ini memuat **seluruh Activity Diagram (Diagram Aktivitas UML)** untuk **semua fitur** pada sistem Apotek Hadinata. Setiap diagram dirancang dengan prinsip *software engineering* formal, membagi peran (*swimlane*), dan **terhubung secara langsung dengan 19 entitas tabel pada Entity Relationship Diagram (ERD)** database MySQL.

---

## Daftar Fitur & Diagram

1. [Peta Arsitektur Global Alur Bisnis Apotek Hadinata](#1-peta-arsitektur-global-alur-bisnis-apotek-hadinata)
2. [Matriks Penelusuran (Traceability Matrix) 19 Tabel ERD](#2-matriks-penelusuran-traceability-matrix-19-tabel-erd)
3. [Fitur 1: Autentikasi Pengguna & Registrasi Berbasis Peran (RBAC)](#fitur-1-autentikasi-pengguna--registrasi-berbasis-peran-rbac)
4. [Fitur 2: Manajemen Profil Pribadi & Buku Alamat Pelanggan](#fitur-2-manajemen-profil-pribadi--buku-alamat-pelanggan)
5. [Fitur 3: Manajemen Master Data Obat & Upload Foto Kemasan](#fitur-3-manajemen-master-data-obat--upload-foto-kemasan)
6. [Fitur 4: Manajemen Kloter Multi-Batch FEFO & Peringatan Kedaluwarsa](#fitur-4-manajemen-kloter-multi-batch-fefo--peringatan-kedaluwarsa)
7. [Fitur 5: Pencarian Katalog Obat & Manajemen Keranjang Belanja](#fitur-5-pencarian-katalog-obat--manajemen-keranjang-belanja)
8. [Fitur 6: Checkout Pemesanan Online, Deteksi GPS, & Alokasi Stok FEFO](#fitur-6-checkout-pemesanan-online-deteksi-gps--alokasi-stok-fefo)
9. [Fitur 7: Pembayaran Midtrans Snap, Webhook SHA-512, & Simulasi Sandbox](#fitur-7-pembayaran-midtrans-snap-webhook-sha-512--simulasi-sandbox)
10. [Fitur 8: Validasi & Persetujuan (ACC) Pesanan oleh Admin/Apoteker](#fitur-8-validasi--persetujuan-acc-pesanan-oleh-adminapoteker)
11. [Fitur 9: Pengantaran Kurir Internal, Shift Gelombang, & Penanganan Gagal](#fitur-9-pengantaran-kurir-internal-shift-gelombang--penanganan-gagal)
12. [Fitur 10: Kasir Gerai Offline (Point of Sale / POS) & Cetak Nota](#fitur-10-kasir-gerai-offline-point-of-sale--pos--cetak-nota)
13. [Fitur 11: Pembatalan Pesanan Mandiri Pelanggan & Pemulihan Stok FEFO](#fitur-11-pembatalan-pesanan-mandiri-pelanggan--pemulihan-stok-fefo)
14. [Fitur 12: Layanan Live Chat Konsultasi Apoteker & Notifikasi Real-Time](#fitur-12-layanan-live-chat-konsultasi-apoteker--notifikasi-real-time)
15. [Fitur 13: Konfigurasi Parameter Apotek & Audit Trail Aktivitas Admin](#fitur-13-konfigurasi-parameter-apotek--audit-trail-aktivitas-admin)
16. [Fitur 14: Manajemen Akun Staf & Penugasan Peran oleh Admin](#fitur-14-manajemen-akun-staf--penugasan-peran-oleh-admin)

---

## 1. Peta Arsitektur Global Alur Bisnis Apotek Hadinata

Diagram makro yang memperlihatkan bagaimana tiga aktor utama (Pelanggan, Admin/Apoteker, Kurir) berinteraksi dengan dua saluran penjualan (Online E-Commerce dan Offline Kasir POS) yang bermuara pada satu basis data inventori obat terintegrasi berbasis FEFO:

```mermaid
flowchart TD
    subgraph Saluran_Pelanggan ["1. Saluran Belanja Online (Pelanggan)"]
        User(["Pelanggan"]) --> Ktg["Katalog & Detail Obat"]
        Ktg --> Cart["Keranjang Belanja (CartItems)"]
        Cart --> Chk["Checkout + GPS + Buku Alamat"]
        Chk --> Pay{"Metode Bayar"}
        Pay -- "Transfer / QRIS" --> MidtransSnap["Payment Gateway Midtrans"]
        Pay -- "COD" --> OrderPending["Orders (status: pending)"]
        MidtransSnap --> OrderPending
    end

    subgraph Saluran_Kasir ["2. Saluran Gerai Offline (Walk-In)"]
        WalkIn(["Pembeli Offline"]) --> POS["Kasir POS Apotek"]
        POS --> CashPay["Bayar Tunai Langsung"]
        CashPay --> OrderPOS["Orders (status: completed, POS)"]
    end

    subgraph Logika_FEFO ["3. Core Engine Farmasi (FEFO)"]
        OrderPending --> FEFO_Reserve["Potong Stok Kloter Terdekat (MedicineBatches) & Catat OrderItemBatches + StockLogs"]
        OrderPOS --> FEFO_Direct["Potong Stok Fisik Kloter Terdekat (MedicineBatches) & Cetak Struk"]
    end

    subgraph Saluran_Logistik ["4. Saluran Logistik Kurir Internal"]
        FEFO_Reserve --> AdminACC["Admin ACC & Siapkan Paket"]
        AdminACC --> ShiftBatch["Alokasi Shift Gelombang (DeliveryBatches)"]
        ShiftBatch --> KurirPickup["Kurir Ambil Tugas (Shippings)"]
        KurirPickup --> MapsNav["Navigasi GPS Pelanggan"]
        MapsNav --> DeliveryStatus{"Status Antar"}
        DeliveryStatus -- "Tiba" --> OrderDone["Pesanan Selesai (completed)"]
        DeliveryStatus -- "Gagal" --> RestockAuto["fefoRestock: Stok Pulih ke Rak (StockLogs: release_reservation)"]
    end
```

---

## 2. Matriks Penelusuran (Traceability Matrix) 19 Tabel ERD

| No | Nama Tabel ERD | Model File | Fitur yang Mengakses / Memodifikasi |
| :---: | :--- | :--- | :--- |
| 1 | `Users` | `user.js` | Fitur 1, 2, 8, 9, 12, 14 |
| 2 | `CustomerAddresses` | `customerAddress.js` | Fitur 2, 6 |
| 3 | `Categories` | `category.js` | Fitur 3, 5 |
| 4 | `Medicines` | `medicine.js` | Fitur 3, 4, 5, 6, 10 |
| 5 | `MedicineBatches` | `medicineBatch.js` | Fitur 4, 6, 9, 10, 11 |
| 6 | `StockLogs` | `stockLog.js` | Fitur 4, 6, 9, 10, 11 |
| 7 | `CartItems` | `cartItem.js` | Fitur 5, 6 |
| 8 | `Orders` | `order.js` | Fitur 6, 7, 8, 9, 10, 11 |
| 9 | `OrderItems` | `orderItem.js` | Fitur 6, 8, 10, 11 |
| 10 | `OrderItemBatches` | `orderItemBatch.js` | Fitur 6, 9, 10, 11 |
| 11 | `Payments` | `payment.js` | Fitur 6, 7, 8, 9, 10 |
| 12 | `Shippings` | `shipping.js` | Fitur 8, 9 |
| 13 | `DeliveryBatches` | `deliveryBatch.js` | Fitur 9 |
| 14 | `OrderStatusHistories`| `orderStatusHistory.js`| Fitur 6, 7, 8, 9, 11 |
| 15 | `ChatRooms` | `chatRoom.js` | Fitur 12 |
| 16 | `ChatMessages` | `chatMessage.js` | Fitur 12 |
| 17 | `Notifications` | `notification.js` | Fitur 4, 6, 7, 8, 9, 11, 12 |
| 18 | `SystemSettings` | `systemSetting.js` | Fitur 6, 10, 13 |
| 19 | `ActivityLogs` | `activityLog.js` | Fitur 3, 4, 10, 13, 14 |

---

## Fitur 1: Autentikasi Pengguna & Registrasi Berbasis Peran (RBAC)

Memastikan pencegahan eskalasi hak akses (*privilege escalation*) di mana registrasi publik mutlak dikunci ke peran `user`, sedangkan staf internal dibuat oleh admin.

```mermaid
flowchart TD
    subgraph Pengguna ["Pengguna (Guest / User)"]
        U1(["Mulai"]) --> U2["Pilih Menu Registrasi / Login"]
        U2 --> U3{"Aksi?"}
        U3 -- "Registrasi Akun Baru" --> U4["Input Nama, Email, No HP, Alamat, Password"]
        U3 -- "Login" --> U5["Input Email & Password"]
        U4 --> U6["Klik 'Daftar Sekarang'"]
        U5 --> U7["Klik 'Masuk'"]
    end

    subgraph BackendAuth ["Backend API & Database (MySQL)"]
        B1["Validasi Format Email & Panjang Password (>= 6)"]
        B2{"Email Sudah Terdaftar?"}
        B3["Tolak Registrasi: Email Duplikat"]
        B4["Enkripsi Password dengan bcrypt (Salt: 10)"]
        B5["Kunci Peran: role = 'user' (Cegah Eskalasi Akses)"]
        B6["Insert record baru ke tabel Users"]
        B7["Cari akun di tabel Users berdasarkan Email"]
        B8{"Akun Ditemukan & Password Cocok?"}
        B9["Tolak Login: Kredensial Tidak Valid"]
        B10["Generate JSON Web Token (JWT) dengan Payload: id, email, role"]
        B11["Kirim Response JWT Token & Objek Profil Pengguna"]
    end

    subgraph FrontendApp ["Frontend React SPA"]
        F1["Simpan JWT di localStorage ('apotek_token')"]
        F2{"Evaluasi Role Pengguna"}
        F3["Redirect ke Halaman Katalog (/catalog)"]
        F4["Redirect ke Dashboard Penjualan (/admin_dashboard)"]
        F5["Redirect ke Job Board Kurir (/courier_jobs)"]
    end

    U6 --> B1
    B1 --> B2
    B2 -- "Ya" --> B3 --> U4
    B2 -- "Tidak" --> B4 --> B5 --> B6 --> U5
    U7 --> B7 --> B8
    B8 -- "Tidak" --> B9 --> U5
    B8 -- "Ya" --> B10 --> B11 --> F1 --> F2
    F2 -- "role: user" --> F3 --> S1(["Selesai"])
    F2 -- "role: admin" --> F4 --> S1
    F2 -- "role: kurir" --> F5 --> S1
```

---

## Fitur 2: Manajemen Profil Pribadi & Buku Alamat Pelanggan

Pengelolaan identitas biodata dan buku alamat multi-lokasi (*CustomerAddresses*) untuk mempermudah pemilihan titik kirim saat checkout.

```mermaid
flowchart TD
    subgraph Pelanggan ["Pelanggan"]
        P1(["Mulai"]) --> P2["Buka Modal Profil Akun"]
        P2 --> P3{"Pilih Tab"}
        P3 -- "Tab Biodata" --> P4["Ubah Nama, No HP, Alamat Utama"]
        P4 --> P5["Klik 'Simpan Biodata'"]
        P3 -- "Tab Buku Alamat" --> P6["Lihat Daftar Alamat Pengiriman Tersimpan"]
        P6 --> P7{"Aksi Alamat"}
        P7 -- "Tambah Alamat Baru" --> P8["Input Label (Rumah/Kantor), Nama Penerima, HP, Alamat, Koordinat"]
        P7 -- "Jadikan Alamat Utama" --> P9["Klik 'Jadikan Utama' pada Alamat Tertentu"]
        P7 -- "Hapus Alamat" --> P10["Klik Tombol Hapus"]
    end

    subgraph BackendProfile ["Backend API & Database"]
        BP1["Update baris tabel Users (name, phone, address)"]
        BP2["Query CustomerAddresses WHERE user_id = :userId ORDER BY is_default DESC"]
        BP3{"Apakah alamat pertama user?"}
        BP4["Set is_default = true otomatis"]
        BP5["Set is_default = false pada alamat lain jika user mencentang 'Utama'"]
        BP6["Insert baris baru ke tabel CustomerAddresses"]
        BP7["Reset semua is_default = false untuk user_id tersebut"]
        BP8["Update target CustomerAddresses SET is_default = true"]
        BP9["Delete baris dari CustomerAddresses WHERE id = :id AND user_id = :userId"]
        BP10{"Alamat yang dihapus berstatus default?"}
        BP11["Promosikan alamat terbaru yang tersisa menjadi is_default = true"]
    end

    P5 --> BP1 --> PR1(["Selesai (Biodata Terupdate)"])
    P6 --> BP2 --> P7
    P8 --> BP3
    BP3 -- "Ya" --> BP4 --> BP6
    BP3 -- "Tidak" --> BP5 --> BP6 --> PR2(["Selesai (Alamat Baru Tersimpan)"])
    P9 --> BP7 --> BP8 --> PR3(["Selesai (Alamat Utama Berubah)"])
    P10 --> BP9 --> BP10
    BP10 -- "Ya" --> BP11 --> PR4(["Selesai (Alamat Dihapus)"])
    BP10 -- "Tidak" --> PR4
```

---

## Fitur 3: Manajemen Master Data Obat & Upload Foto Kemasan

Apoteker mengelola katalog obat resmi BPOM, penentuan klasifikasi (Obat Bebas, Bebas Terbatas, Suplemen), penetapan harga, SKU, serta unggah kemasan produk via Multer.

```mermaid
flowchart TD
    subgraph Apoteker ["Admin / Apoteker"]
        M1(["Mulai"]) --> M2["Buka Menu 'Inventori FEFO'"]
        M2 --> M3["Klik 'Tambah Obat Baru' / 'Ubah Obat'"]
        M3 --> M4["Pilih File Foto Kemasan (JPG/PNG/WEBP maks 4MB)"]
        M4 --> M5["Isi Nama Obat, Kategori, SKU, Harga, Khasiat/Deskripsi"]
        M5 --> M6["Klik 'Simpan Master Obat'"]
    end

    subgraph BackendUpload ["Backend API (Multer & Controller)"]
        UPL1["Middleware Multer: Validasi Ekstensi & Ukuran File"]
        UPL2{"File Memenuhi Syarat?"}
        UPL3["Tolak Upload: Format salah atau ukuran melebihi 4MB"]
        UPL4["Simpan file fisik ke direktori /uploads/medicines/"]
        UPL5["Generate URL path gambar: /uploads/medicines/:filename"]
        UPL6["Validasi Keunikan SKU_code pada tabel Medicines"]
        UPL7{"SKU Unik?"}
        UPL8["Tolak Simpan: Kode SKU sudah dipakai"]
        UPL9["Insert/Update baris tabel Medicines"]
        UPL10["Catat rekam jejak pada tabel ActivityLogs (action: CREATE/UPDATE_MEDICINE)"]
        UPL11["Kirim Response Data Obat Berhasil Disimpan"]
    end

    M1 --> M2 --> M3 --> M4 --> UPL1
    UPL1 --> UPL2
    UPL2 -- "Gagal" --> UPL3 --> M4
    UPL2 -- "Lolos" --> UPL4 --> UPL5 --> M5 --> M6 --> UPL6
    UPL6 --> UPL7
    UPL7 -- "Duplikat" --> UPL8 --> M5
    UPL7 -- "Valid" --> UPL9 --> UPL10 --> UPL11 --> MS1(["Selesai (Katalog Terupdate)"])
```

---

## Fitur 4: Manajemen Kloter Multi-Batch FEFO & Peringatan Kedaluwarsa

Mengakomodasi penerimaan pasokan obat dari distributor PBF (*Pedagang Besar Farmasi*), pencatatan nomor *batch*, tanggal kedaluwarsa, dan pemicu peringatan stok otomatis.

```mermaid
flowchart TD
    subgraph AdminApotek ["Apoteker Pengelola Apotek (APA)"]
        B1(["Mulai"]) --> B2["Buka Sub-Tabel 'Kloter FEFO' pada Obat Spesifik"]
        B2 --> B3["Klik 'Tambah Kloter Batch Baru'"]
        B3 --> B4["Input Nomor Kloter (batch_number), Tanggal Kedaluwarsa, Kuantitas Stok"]
        B4 --> B5["Klik 'Simpan Kloter'"]
    end

    subgraph BackendBatchLogic ["Backend FEFO Engine & Database"]
        BL1["Validasi: Tanggal Kedaluwarsa harus > Hari Ini"]
        BL2{"Tanggal Valid & Kuantitas > 0?"}
        BL3["Tampilkan Error: Batch sudah kedaluwarsa / kuantitas invalid"]
        BL4["Insert baris baru ke tabel MedicineBatches"]
        BL5["Hitung Akumulasi Total Stok Obat di tabel Medicines"]
        BL6["Catat mutasi di tabel StockLogs (activity_type: stock_in)"]
        BL7["Catat jejak audit di tabel ActivityLogs (action: ADD_MEDICINE_BATCH)"]
        BL8["Panggil Evaluasi Alert Otomatis (inventoryAlerts)"]
        BL9{"Stok <= 10 unit ATAU Sisa Hari ED <= 30 hari?"}
        BL10["Cek Deduplikasi 24 Jam di tabel Notifications"]
        BL11{"Sudah Dinotifikasi dalam 24 Jam Terakhir?"}
        BL12["Lewati (Cegah Spam)"]
        BL13["Insert notifikasi peringatan baru ke tabel Notifications"]
    end

    B1 --> B2 --> B3 --> B4 --> B5 --> BL1
    BL1 --> BL2
    BL2 -- "Tidak" --> BL3 --> B4
    BL2 -- "Ya" --> BL4 --> BL5 --> BL6 --> BL7 --> BL8 --> BL9
    BL9 -- "Tidak" --> BL14(["Selesai (Kloter Aktif)"])
    BL9 -- "Ya" --> BL10 --> BL11
    BL11 -- "Ya" --> BL12 --> BL14
    BL11 -- "Belum" --> BL13 --> BL14
```

---

## Fitur 5: Pencarian Katalog Obat & Manajemen Keranjang Belanja

Pelanggan mencari obat, memfilter kategori, melihat transparansi masa kedaluwarsa terdekat, dan mengelola isi keranjang belanja secara real-time.

```mermaid
flowchart TD
    subgraph PelangganKatalog ["Pelanggan"]
        K1(["Mulai"]) --> K2["Buka Halaman Katalog Obat"]
        K2 --> K3["Ketik Pencarian / Filter Kategori Farmasi"]
        K3 --> K4["Lihat Kartu Obat, Harga, & Indikator Stok FEFO"]
        K4 --> K5["Klik 'Tambah ke Keranjang'"]
        K5 --> K6["Buka Halaman Keranjang Belanja"]
        K6 --> K7{"Aksi Keranjang"}
        K7 -- "Ubah Kuantitas (+/-)" --> K8["Klik Tombol Tambah / Kurang"]
        K7 -- "Hapus Item" --> K9["Klik Tombol Hapus Obat"]
        K7 -- "Kosongkan Keranjang" --> K10["Klik 'Kosongkan Seluruh Keranjang'"]
        K7 -- "Lanjut Checkout" --> K11["Klik 'Lanjut ke Checkout'"]
    end

    subgraph BackendCart ["Backend API & Database"]
        BC1["Query Medicines JOIN MedicineBatches WHERE expiry_date >= TODAY"]
        BC2["Hitung Sisa Stok Valid (Hanya kloter yang belum kedaluwarsa)"]
        BC3["Cek ketersediaan di CartItems pelanggan"]
        BC4{"Sudah ada di keranjang?"}
        BC5["Update CartItems: kuantitas = kuantitas + 1"]
        BC6["Insert baris baru ke tabel CartItems"]
        BC7["Validasi kuantitas baru <= Total Stok Valid"]
        BC8{"Kuantitas Melebihi Stok?"}
        BC9["Tolak Update: Sisa stok tidak mencukupi"]
        BC10["Update kuantitas pada tabel CartItems"]
        BC11["Delete baris spesifik dari tabel CartItems"]
        BC12["Delete semua baris CartItems WHERE user_id = :userId"]
        BC13["Kalkulasi Subtotal Harga = SUM(price * quantity)"]
    end

    K1 --> K2 --> BC1 --> BC2 --> K3 --> K4 --> K5 --> BC3
    BC3 --> BC4
    BC4 -- "Sudah Ada" --> BC5 --> K6
    BC4 -- "Belum Ada" --> BC6 --> K6
    K6 --> BC13 --> K7
    K8 --> BC7 --> BC8
    BC8 -- "Ya" --> BC9 --> K6
    BC8 -- "Tidak" --> BC10 --> BC13 --> K6
    K9 --> BC11 --> BC13 --> K6
    K10 --> BC12 --> K6
    K11 --> CHK_START(["Masuk ke Alur Checkout"])
```

---

## Fitur 6: Checkout Pemesanan Online, Deteksi GPS, & Alokasi Stok FEFO

Pemisahan alur pemesanan online pelanggan dengan validasi stok multi-kloter (*First Expire First Out*), deteksi titik koordinat pengantaran, dan kalkulasi ongkos kirim dinamis.

```mermaid
flowchart TD
    subgraph CustomerCheckout ["Pelanggan (Checkout)"]
        CO1(["Mulai"]) --> CO2["Pilih Alamat Tujuan dari CustomerAddresses"]
        CO2 --> CO3["Klik 'Deteksi Lokasi GPS Saya' (Opsional)"]
        CO3 --> CO4["Pilih Pembayaran: Midtrans Snap (QRIS) ATAU Bayar di Tempat (COD)"]
        CO4 --> CO5["Input Catatan Pengantaran Khusus"]
        CO5 --> CO6["Klik 'Konfirmasi & Buat Pesanan'"]
    end

    subgraph BackendTransaction ["Backend Database Transaction (ACID)"]
        BT1["Mulai Database Transaction (START TRANSACTION)"]
        BT2["Ambil data SystemSettings (tarif ongkir default & ambang gratis ongkir)"]
        BT3["Hitung Ongkos Kirim: Jika Subtotal >= free_shipping_min_order maka Ongkir = 0, selain itu default"]
        BT4["Ambil Semua Kloter Obat Aktif (MedicineBatches) dengan PENGUNCIAN: ORDER BY expiry_date ASC FOR UPDATE"]
        BT5{"Apakah Total Stok Fisik Masih Cukup?"}
        BT6["ROLLBACK Transaksi & Kembalikan Error: Stok obat habis terambil pembeli lain"]
        BT7["Insert Header Transaksi ke tabel Orders (order_status: pending, payment_status: unpaid)"]
        BT8["Loop setiap produk keranjang: Insert ke tabel OrderItems"]
        BT9["Eksekusi Algoritma FEFO:<br/>Alokasikan pemotongan kuantitas ke MedicineBatches dengan ED terdekat lebih dulu"]
        BT10["Catat alokasi kloter spesifik pada tabel OrderItemBatches"]
        BT11["Kurangi kolom stock pada tabel MedicineBatches"]
        BT12["Catat jejak pemotongan pada tabel StockLogs (activity_type: stock_out, notes: FEFO Checkout #orderId)"]
        BT13["Buat baris baru di tabel OrderStatusHistories (status: pending)"]
        BT14["Hapus seluruh isi tabel CartItems milik pelanggan"]
        BT15{"Pilihan Metode Pembayaran?"}
        BT16["Inisialisasi Midtrans Snap API & Simpan tabel Payments (method: QRIS, status: unpaid)"]
        BT17["Simpan langsung ke tabel Payments (method: COD, status: unpaid)"]
        BT18["COMMIT Transaksi Database"]
        BT19["Buat Notifikasi Pesanan Baru di tabel Notifications untuk Admin Apotek"]
    end

    CO1 --> CO2 --> CO3 --> CO4 --> CO5 --> CO6 --> BT1
    BT1 --> BT2 --> BT3 --> BT4 --> BT5
    BT5 -- "Tidak" --> BT6 --> CO6
    BT5 -- "Ya" --> BT7 --> BT8 --> BT9 --> BT10 --> BT11 --> BT12 --> BT13 --> BT14 --> BT15
    BT15 -- "Midtrans" --> BT16 --> BT18
    BT15 -- "COD" --> BT17 --> BT18
    BT18 --> BT19 --> CO_FIN(["Pesanan Dibuat & Menunggu Pembayaran/ACC"])
```

---

## Fitur 7: Pembayaran Midtrans Snap, Webhook SHA-512, & Simulasi Sandbox

Menjamin integritas verifikasi pembayaran digital dengan validasi *Signature Key* SHA-512, pembaruan status lunas, serta simulasi lokal untuk keperluan presentasi sidang tanpa ketergantungan tunnel eksternal.

```mermaid
flowchart TD
    subgraph PelangganBayar ["Pelanggan"]
        PB1(["Mulai"]) --> PB2["Buka Jendela Midtrans Snap Popup"]
        PB2 --> PB3["Pilih QRIS / Virtual Account"]
        PB3 --> PB4["Selesaikan Pembayaran di Aplikasi E-Wallet / Mobile Banking"]
        PB4 --> PB5["Midtrans Mengirim Notifikasi Status"]
    end

    subgraph MidtransServer ["Server Midtrans"]
        MS1["Generate SHA-512 Signature Hash:<br/>SHA512(order_id + status_code + gross_amount + ServerKey)"]
        MS2["Kirim HTTP POST Webhook ke /api/webhooks/midtrans"]
    end

    subgraph BackendWebhook ["Backend Webhook Controller"]
        BW1["Terima Payload Webhook Midtrans"]
        BW2["Hitung Ulang Hash SHA-512 menggunakan Environment Server Key"]
        BW3{"Apakah Signature Hash Cocok?"}
        BW4["Tolak Request (HTTP 401: Invalid Signature Webhook)"]
        BW5{"Status Transaksi Midtrans?"}
        BW6["Update Payments (status: paid) & Orders (payment_status: paid)"]
        BW7["Catat riwayat ke OrderStatusHistories (paid)"]
        BW8["Kirim Notifikasi ke Admin: Pembayaran Lunas Terverifikasi"]
        BW9["Panggil Utilitas fefoRestock: Kembalikan stok kloter MedicineBatches"]
        BW10["Update Orders (order_status: cancelled) & Payments (status: failed)"]
        BW11["Catat StockLogs (release_reservation karena expired/cancel)"]
    end

    subgraph SimulasiLokal ["Simulasi Sandbox Sidang (Tanpa Ngrok)"]
        SS1["Admin / Penguji Klik 'Simulasi Lunas' di UI Riwayat Pesanan"]
        SS2["Panggil Endpoint POST /api/orders/:id/verify-payment { simulate_sandbox: true }"]
        SS3["Backend Memverifikasi Order Status & Mengeset payment_status: paid secara aman"]
    end

    PB1 --> PB2 --> PB3 --> PB4 --> MS1 --> MS2 --> BW1
    BW1 --> BW2 --> BW3
    BW3 -- "Palsu/Invalid" --> BW4
    BW3 -- "Valid" --> BW5
    BW5 -- "settlement / capture" --> BW6 --> BW7 --> BW8 --> PB_DONE(["Pembayaran Berhasil Lunas"])
    BW5 -- "expire / cancel / deny" --> BW9 --> BW10 --> BW11 --> PB_FAIL(["Pesanan Dibatalkan Otomatis"])
    SS1 --> SS2 --> SS3 --> BW6
```

---

## Fitur 8: Validasi & Persetujuan (ACC) Pesanan oleh Admin/Apoteker

Apoteker memvalidasi kelayakan pesanan, memastikan kepatuhan resep/indikasi, dan meneruskan pesanan berstatus *processing* ke antrean logistik kurir.

```mermaid
flowchart TD
    subgraph ApotekerReview ["Admin / Apoteker"]
        AR1(["Mulai"]) --> AR2["Buka Menu 'Validasi Pesanan'"]
        AR2 --> AR3["Pilih Pesanan Masuk (Status: pending)"]
        AR3 --> AR4["Periksa Rincian Obat, Alamat Pengiriman, & Bukti Bayar"]
        AR4 --> AR5{"Keputusan Apoteker"}
        AR5 -- "ACC & Proses Pesanan" --> AR6["Klik Tombol 'Setujui Pesanan'"]
        AR5 -- "Tolak Pesanan" --> AR7["Klik Tombol 'Batalkan Pesanan'"]
    end

    subgraph BackendApproval ["Backend Database Processing"]
        BA1["Update tabel Orders: order_status = 'processing'"]
        BA2["Catat riwayat ke tabel OrderStatusHistories"]
        BA3["Buat Antrean Pengiriman baru di tabel Shippings:<br/>order_id, shipping_status = 'pending', shipping_address, latitude, longitude"]
        BA4["Kirim Notifikasi ke Pelanggan: 'Pesanan Anda telah disetujui apotek'"]
        BA5["Kirim Notifikasi ke Portal Kurir: 'Paket siap diambil (pickup)'"]
        BA6["Panggil fefoRestock: Pulihkan kuantitas stok MedicineBatches dari OrderItemBatches"]
        BA7["Update Orders: order_status = 'cancelled'"]
        BA8["Catat mutasi di StockLogs (activity: release_reservation)"]
        BA9["Kirim Notifikasi Pembatalan ke Pelanggan"]
    end

    AR1 --> AR2 --> AR3 --> AR4 --> AR5
    AR6 --> BA1 --> BA2 --> BA3 --> BA4 --> BA5 --> AR_FIN1(["Pesanan Masuk ke Antrean Siap Antar"])
    AR7 --> BA6 --> BA7 --> BA8 --> BA9 --> AR_FIN2(["Pesanan Ditolak & Stok Pulih"])
```

---

## Fitur 9: Pengantaran Kurir Internal, Shift Gelombang, & Penanganan Gagal

Kurir mengambil pesanan, sistem otomatis membagi ke kloter harian (*DeliveryBatches*), kurir bernavigasi dengan Google Maps, dan sistem otomatis mengembalikan stok jika terjadi kegagalan serah terima.

```mermaid
flowchart TD
    subgraph KurirOperasional ["Kurir Internal Apotek"]
        KO1(["Mulai"]) --> KO2["Buka Portal Kurir: Tab 'Tugas Tersedia'"]
        KO2 --> KO3["Lihat Daftar Shippings (status: pending)"]
        KO3 --> KO4["Klik 'Ambil Tugas (Pickup)' pada Paket"]
        KO4 --> KO5["Buka Titik Navigasi Google Maps (GPS Pelanggan)"]
        KO5 --> KO6["Antar Paket Obat Fisik ke Lokasi Pembeli"]
        KO6 --> KO7{"Paket Berhasil Diserahterimakan?"}
        KO7 -- "Berhasil" --> KO8["Terima Uang Tunai (Bila COD) & Klik 'Selesaikan Pengantaran'"]
        KO7 -- "Gagal / Rumah Kosong" --> KO9["Pilih Alasan Kendala & Klik 'Pengantaran Gagal'"]
    end

    subgraph BackendLogistik ["Backend API & Logistik Shift"]
        BL1["Evaluasi Waktu Pengambilan untuk Shift Kurir:<br/>- Jam < 14.00 WIB ➔ Shift 1 (Pagi-Siang)<br/>- Jam >= 14.00 WIB ➔ Shift 2 (Sore-Malam)"]
        BL2["Cari atau Buat Record baru di tabel DeliveryBatches (delivery_date: TODAY, batch_number: 1/2)"]
        BL3["Update Shippings: shipping_status = 'shipping', admin_id = kurir_id, delivery_batch_id = batch_id"]
        BL4["Update Orders: order_status = 'shipping'"]
        BL5["Catat OrderStatusHistories & Kirim Notifikasi ke Pelanggan: 'Kurir sedang menuju alamat Anda'"]
        BL6["Update Shippings: shipping_status = 'delivered'"]
        BL7["Update Orders: order_status = 'completed', payment_status = 'paid' (jika COD)"]
        BL8["Catat OrderStatusHistories (status: completed) & Kirim Notifikasi 'Paket Diterima'"]
        BL9["Update Shippings: shipping_status = 'failed'"]
        BL10["Update Orders: order_status = 'cancelled'"]
        BL11["Panggil fefoRestock: Kembalikan obat ke kloter asal MedicineBatches"]
        BL12["Catat StockLogs (release_reservation karena gagal antar)"]
        BL13["Kirim Notifikasi ke Admin: Pengantaran Terkendala"]
    end

    KO1 --> KO2 --> KO3 --> KO4 --> BL1
    BL1 --> BL2 --> BL3 --> BL4 --> BL5 --> KO5 --> KO6 --> KO7
    KO8 --> BL6 --> BL7 --> BL8 --> KO_DONE1(["Pengantaran Sukses Selesai"])
    KO9 --> BL9 --> BL10 --> BL11 --> BL12 --> BL13 --> KO_DONE2(["Paket Gagal & Stok Kembali ke Rak"])
```

---

## Fitur 10: Kasir Gerai Offline (Point of Sale / POS) & Cetak Nota

Transaksi penjualan langsung di apotek untuk pembeli *walk-in*, pemotongan kloter FEFO seketika, kalkulasi uang kembalian, cetak struk kasir thermal 80mm, dan pencatatan audit log kasir.

```mermaid
flowchart TD
    subgraph PetugasKasir ["Kasir / Apoteker Gerai"]
        CS1(["Mulai"]) --> CS2["Buka Tab 'Kasir POS'"]
        CS2 --> CS3["Cari Obat melalui SKU / Nama Obat"]
        CS3 --> CS4["Tentukan Jumlah Pembelian"]
        CS4 --> CS5["Input Nama Pembeli & Jumlah Nominal Uang Tunai"]
        CS5 --> CS6["Klik 'Simpan Transaksi Kasir'"]
    end

    subgraph BackendPOSSystem ["Backend POS Engine & Database"]
        BP1["Validasi Ketersediaan Stok Aktif (MedicineBatches)"]
        BP2{"Stok Cukup & Uang Diterima >= Total Harga?"}
        BP3["Kembalikan Pesan Error: Stok Habis / Uang Tunai Kurang"]
        BP4["Insert baris baru ke tabel Orders (order_status: completed, payment_status: paid, total_payment)"]
        BP5["Insert rincian belanja ke tabel OrderItems"]
        BP6["Alokasikan kloter FEFO terdekat & potong stok pada MedicineBatches"]
        BP7["Simpan alokasi kloter kasir pada tabel OrderItemBatches"]
        BP8["Catat mutasi di tabel StockLogs (activity_type: stock_out, notes: 'Kasir POS #orderId')"]
        BP9["Insert ke tabel Payments (payment_method: CASH, status: paid)"]
        BP10["Catat jejak audit di tabel ActivityLogs (action: POS_OFFLINE_TRANSACTION, admin_id)"]
        BP11["Hitung Nilai Uang Kembalian (change = amount_paid - total_payment)"]
        BP12["Kirim Response Sukses Transaksi beserta Data Cetak Nota"]
    end

    subgraph ModulCetak ["Cetak Nota Struk"]
        CP1["Buka Antarmuka Cetak: Pilihan Struk Thermal 80mm ATAU Faktur A5"]
        CP2["Cetak Struk Fisik & Serahkan ke Pembeli beserta Obat"]
    end

    CS1 --> CS2 --> CS3 --> CS4 --> CS5 --> CS6 --> BP1
    BP1 --> BP2
    BP2 -- "Tidak" --> BP3 --> CS4
    BP2 -- "Ya" --> BP4 --> BP5 --> BP6 --> BP7 --> BP8 --> BP9 --> BP10 --> BP11 --> BP12 --> CP1 --> CP2 --> CS_END(["Transaksi Kasir Selesai"])
```

---

## Fitur 11: Pembatalan Pesanan Mandiri Pelanggan & Pemulihan Stok FEFO

Hak pelanggan untuk membatalkan pesanan yang belum diproses/dibayar tanpa perlu menghubungi admin, dengan pengembalian kuantitas obat ke kloter asal secara transaksional.

```mermaid
flowchart TD
    subgraph PelangganBatal ["Pelanggan"]
        PB1(["Mulai"]) --> PB2["Buka Menu 'Riwayat Pesanan'"]
        PB2 --> PB3["Pilih Pesanan yang Berstatus 'pending'"]
        PB3 --> PB4["Klik Tombol 'Batalkan Pesanan'"]
        PB4 --> PB5["Tampil Dialog Konfirmasi & Input Alasan Pembatalan"]
        PB5 --> PB6["Klik 'Ya, Batalkan Pesanan'"]
    end

    subgraph BackendCancel ["Backend Transactional Restock Engine"]
        BC1["Mulai Database Transaction (START TRANSACTION)"]
        BC2["Validasi: Pesanan milik user_id yang sedang login"]
        BC3{"Apakah Status Order = 'pending' & Payment != 'paid'?"}
        BC4["ROLLBACK & Tolak: Pesanan sudah diproses/dibayar (harus hubungi apoteker)"]
        BC5["Update tabel Orders: order_status = 'cancelled'"]
        BC6["Catat ke tabel OrderStatusHistories (status: cancelled, notes: alasan)"]
        BC7["Ambil seluruh OrderItemBatches yang terikat pada pesanan"]
        BC8["Loop setiap batch: Tambahkan kembali kuantitas ke kolom stock pada MedicineBatches"]
        BC9["Catat log mutasi pengembalian di tabel StockLogs (activity_type: release_reservation)"]
        BC10["COMMIT Transaksi Database"]
        BC11["Kirim Notifikasi ke Admin: 'Pesanan #id Dibatalkan oleh Pelanggan'"]
    end

    PB1 --> PB2 --> PB3 --> PB4 --> PB5 --> PB6 --> BC1
    BC1 --> BC2 --> BC3
    BC3 -- "Tidak" --> BC4 --> PB2
    BC3 -- "Ya" --> BC5 --> BC6 --> BC7 --> BC8 --> BC9 --> BC10 --> BC11 --> CANCEL_DONE(["Pesanan Dibatalkan & Stok Kembali Utuh"])
```

---

## Fitur 12: Layanan Live Chat Konsultasi Apoteker & Notifikasi Real-Time

Saluran komunikasi konsultasi klinis indikasi dan dosis obat dua arah antara pembeli dan apoteker jaga, serta pemusatan lonceng notifikasi akun.

```mermaid
flowchart TD
    subgraph ChatUserFlow ["Pelanggan"]
        CU1(["Mulai"]) --> CU2["Buka Tab 'Apoteker' / Menu Konsultasi"]
        CU2 --> CU3["Ketik Keluhan Kesehatan / Tanya Dosis Obat"]
        CU3 --> CU4["Klik Tombol Kirim Pesan"]
        CU4 --> CU5["Menerima Balasan Solutif dari Apoteker Jaga"]
    end

    subgraph BackendChatServer ["Backend Chat & Notification Engine"]
        BCS1["Cari atau Buat Ruang Konsultasi di tabel ChatRooms (user_id)"]
        BCS2["Insert pesan ke tabel ChatMessages (room_id, sender_id: user, message, is_read: false)"]
        BCS3["Insert notifikasi baru ke tabel Notifications untuk seluruh Admin (type: 'chat')"]
        BCS4["Admin Membuka Room: Update ChatMessages pelanggan SET is_read = true"]
        BCS5["Insert pesan balasan ke tabel ChatMessages (room_id, sender_id: admin, message)"]
        BCS6["Insert notifikasi ke tabel Notifications untuk Pelanggan (type: 'chat')"]
        BCS7["Pengguna Mengklik Lonceng Notifikasi"]
        BCS8["Update Notifications: is_read = true"]
    end

    subgraph ChatAdminFlow ["Admin / Apoteker Jaga"]
        CA1["Melihat Badge Notifikasi Chat Masuk"]
        CA2["Buka 'Live Chat' Console"]
        CA3["Pilih Pasien yang Menunggu Respon"]
        CA4["Ketik Edukasi Penggunaan Obat & Kirim"]
    end

    CU1 --> CU2 --> CU3 --> CU4 --> BCS1 --> BCS2 --> BCS3 --> CA1
    CA1 --> CA2 --> CA3 --> BCS4 --> CA4 --> BCS5 --> BCS6 --> CU5
    CU5 --> BCS7 --> BCS8 --> CHAT_DONE(["Konsultasi Apoteker Selesai"])
```

---

## Fitur 13: Konfigurasi Parameter Apotek & Audit Trail Aktivitas Admin

Pengaturan legalitas apotek, jam operasional, koordinat gerai fisik, dan tarif logistik kurir dinamis yang otomatis tersinkronisasi ke header, footer, checkout, serta struk nota.

```mermaid
flowchart TD
    subgraph PengaturanAdmin ["Admin Apotek"]
        ST1(["Mulai"]) --> ST2["Buka Tab 'Pengaturan & Staf' -> Sub-menu 'Pengaturan Gerai'"]
        ST2 --> ST3["Ubah Parameter: SIPA, Jam Operasional, No Telp, Alamat, Titik GPS, Ongkir Default, Ambang Bebas Ongkir"]
        ST3 --> ST4["Klik 'Simpan Pengaturan Apotek'"]
        ST4 --> ST5["Buka Sub-menu 'Log Audit Aktivitas'"]
        ST5 --> ST6["Filter berdasarkan Aksi (POS, BATCH, SETTINGS, ROLE)"]
    end

    subgraph BackendSettings ["Backend System Settings & Audit"]
        BS1["Terima Payload Pengaturan Baru"]
        BS2["Loop setiap key: Update nilai pada tabel SystemSettings (setting_value, updated_by: admin_id)"]
        BS3["Catat riwayat ke tabel ActivityLogs (action: UPDATE_SYSTEM_SETTINGS, description: kunci yang diubah)"]
        BS4["Query tabel ActivityLogs JOIN Users ON admin_id = User.id ORDER BY createdAt DESC"]
        BS5["Kirim Data Log Audit Terfilter ke Antarmuka Admin"]
    end

    subgraph TampilanWebGlobal ["Sinkronisasi Otomatis Antarmuka"]
        TG1["Header & Footer Website: Memperbarui No SIPA, Jam Layanan, & Telp"]
        TG2["Halaman Checkout: Memperbarui ambang gratis ongkir & tarif dasar kurir"]
        TG3["Struk Kasir & Faktur: Memperbarui identitas legalitas apotek"]
    end

    ST1 --> ST2 --> ST3 --> ST4 --> BS1
    BS1 --> BS2 --> BS3 --> TG1
    TG1 --> TG2 --> TG3 --> ST_FIN1(["Pengaturan Tersimpan & Sinkron"])
    ST5 --> ST6 --> BS4 --> BS5 --> ST_FIN2(["Log Aktivitas Tertinjau"])
```

---

## Fitur 14: Manajemen Akun Staf & Penugasan Peran oleh Admin

Admin utama mengelola hak akses akun staf apotek (menambah akun staf internal, kurir, serta menaikkan/menurunkan peran akun) secara terotorisasi.

```mermaid
flowchart TD
    subgraph StafAdminManagement ["Admin Utama"]
        SA1(["Mulai"]) --> SA2["Buka Tab 'Pengaturan & Staf' -> Sub-menu 'Kelola Staf & Kurir'"]
        SA2 --> SA3{"Pilih Aksi"}
        SA3 -- "Tambah Akun Baru" --> SA4["Klik 'Tambah Staf / Kurir'"]
        SA4 --> SA5["Input Nama, Email, Password Sementara, No HP, Peran (admin/kurir)"]
        SA5 --> SA6["Klik 'Daftarkan Staf'"]
        SA3 -- "Ubah Peran Akun" --> SA7["Pilih Akun pada Tabel Pengguna"]
        SA7 --> SA8["Ubah Dropdown Role (admin / kurir / user) & Konfirmasi"]
    end

    subgraph BackendStaffLogic ["Backend User Management & RBAC"]
        BLU1["Validasi Format Data & Keunikan Email di tabel Users"]
        BLU2{"Email Belum Terdaftar?"}
        BLU3["Tolak Pendaftaran: Email staf sudah terdaftar"]
        BLU4["Enkripsi Password dengan bcrypt"]
        BLU5["Insert record baru ke tabel Users (role: admin / kurir)"]
        BLU6["Catat audit di tabel ActivityLogs (action: CREATE_STAFF_ACCOUNT)"]
        BLU7["Update kolom role pada tabel Users WHERE id = :userId"]
        BLU8["Catat audit di tabel ActivityLogs (action: UPDATE_USER_ROLE, description: role baru)"]
    end

    SA1 --> SA2 --> SA3
    SA4 --> SA5 --> SA6 --> BLU1
    BLU1 --> BLU2
    BLU2 -- "Duplikat" --> BLU3 --> SA5
    BLU2 -- "Valid" --> BLU4 --> BLU5 --> BLU6 --> STAF_DONE1(["Akun Staf Berhasil Didaftarkan"])
    SA7 --> SA8 --> BLU7 --> BLU8 --> STAF_DONE2(["Peran Akun Berhasil Diperbarui"])
```

---

## Ringkasan Standar Pengujian Akademis & Sidang Skripsi

1. **Kelengkapan Fitur 100%:** Mencakup seluruh 14 fitur sistem dari hulu ke hilir (Registrasi, Profil, Katalog, Keranjang, Checkout, Midtrans, Verifikasi, Logistik Kurir, Kasir POS, Pembatalan FEFO, Live Chat, Notifikasi, Pengaturan Apotek, dan Manajemen Staf).
2. **Keterlacakan ERD Eksplisit:** Setiap *node* proses backend menyebutkan secara presisi tabel mana yang di-*query* (`SELECT`), dibuat (`INSERT`), diperbarui (`UPDATE`), atau dihapus (`DELETE`).
3. **Kepatuhan Terhadap Regulasi Farmasi & Keamanan:** Menyajikan algoritma rotasi mutasi obat **FEFO**, proteksi pembatalan mandiri, validasi *hash signature* webhook pembayaran, serta jejak audit lengkap (*ActivityLogs* & *StockLogs*).
