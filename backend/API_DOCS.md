# Dokumentasi API Apotek Backend

Dokumentasi ini mencakup seluruh spesifikasi teknis endpoint API, struktur request/response, autentikasi, serta pembagian hak akses (role-based access control) untuk sistem Apotek.

---

## 📌 Informasi Umum

- **Base URL:** `http://localhost:3000/api`
- **Format Payload:** `application/json` (seluruh request dan response)
- **Autentikasi:** JSON Web Token (JWT) dikirim melalui header `Authorization`.
  - Format Header: `Authorization: Bearer <JWT_TOKEN>`

### Peran & Hak Akses (Roles)
Sistem memiliki tiga level hak akses:
1.  **Public:** Dapat diakses tanpa token.
2.  **User:** Pelanggan/pembeli umum. Memerlukan autentikasi.
3.  **Admin:** Pengelola apotek & kasir POS. Memiliki hak penuh untuk mengelola master data obat, stok, kategori, dan pesanan offline.
4.  **Kurir:** Petugas logistik pengiriman obat. Memiliki akses khusus untuk mengambil pekerjaan pengiriman (*shipping jobs*) dan memperbarui status antar.

---

## 📑 Daftar Isi
1. [Autentikasi & Profil Pengguna (`/api/auth`)](#1-autentikasi--profil-pengguna-apiauth)
2. [Manajemen Kategori Obat (`/api/categories`)](#2-manajemen-kategori-obat-apicategories)
3. [Manajemen Obat & Batch Stok (`/api/medicines`)](#3-manajemen-obat--batch-stok-apimedicines)
4. [Keranjang Belanja (`/api/cart`)](#4-keranjang-belanja-apicart)
5. [Transaksi & POS Kasir (`/api/checkout` & `/api/orders`)](#5-transaksi--pos-kasir-apicheckout--apiorders)
6. [Webhook Midtrans (`/api/webhooks/midtrans`)](#6-webhook-midtrans-apiwebhooksmidtrans)
7. [Logistik Pengiriman (`/api/shipping`)](#7-logistik-pengiriman-apishipping)
8. [Layanan Chat CS (`/api/chats`)](#8-layanan-chat-cs-apichats)
9. [Sistem Notifikasi (`/api/notifications`)](#9-sistem-notifikasi-apinotifications)

---

## 1. Autentikasi & Profil Pengguna (`/api/auth`)

### Register Akun Baru
Pendaftaran akun baru untuk pelanggan, admin, maupun kurir.

-   **URL:** `/auth/register`
-   **Method:** `POST`
-   **Akses:** Public
-   **Request Body:**
    ```json
    {
      "name": "Budi Santoso",
      "email": "budi.santoso@example.com",
      "phone": "081234567890",
      "password": "password123",
      "address": "Jl. Mawar No. 10, Jakarta",
      "role": "user"
    }
    ```
    *Catatan: `role` bersifat opsional, bernilai default `"user"`. Pilihan nilai: `"user"`, `"admin"`, `"kurir"`.*

-   **Response Sukses (210 Created):**
    ```json
    {
      "status": "success",
      "message": "Registrasi berhasil! Silakan masuk ke akun Anda",
      "user": {
        "id": 5,
        "name": "Budi Santoso",
        "email": "budi.santoso@example.com",
        "phone": "081234567890",
        "role": "user"
      }
    }
    ```

-   **Response Gagal (409 Conflict):**
    ```json
    {
      "message": "Email sudah terdaftar, silakan gunakan email lain"
    }
    ```

---

### Login Akun
Mendapatkan JWT Token untuk mengakses endpoint terproteksi.

-   **URL:** `/auth/login`
-   **Method:** `POST`
-   **Akses:** Public
-   **Request Body:**
    ```json
    {
      "email": "budi.santoso@example.com",
      "password": "password123"
    }
    ```

-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Login berhasil",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiZW1haWwiOiJidWRp...",
      "user": {
        "id": 5,
        "name": "Budi Santoso",
        "email": "budi.santoso@example.com",
        "phone": "081234567890",
        "role": "user"
      }
    }
    ```

-   **Response Gagal (401 Unauthorized):**
    ```json
    {
      "message": "Email atau password salah"
    }
    ```

---

### Ambil Profil Pengguna
Mengambil informasi lengkap profil pengguna yang sedang login.

-   **URL:** `/auth/profile`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (Semua Peran)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "user": {
        "id": 5,
        "name": "Budi Santoso",
        "email": "budi.santoso@example.com",
        "phone": "081234567890",
        "role": "user",
        "address": "Jl. Mawar No. 10, Jakarta",
        "createdAt": "2026-07-13T09:00:00.000Z",
        "updatedAt": "2026-07-13T09:00:00.000Z"
      }
    }
    ```

---

### Perbarui Profil Pengguna
Memperbarui informasi profil sendiri (nama, nomor HP, dan alamat).

-   **URL:** `/auth/profile`
-   **Method:** `PUT`
-   **Akses:** Terautentikasi (Semua Peran)
-   **Request Body:**
    ```json
    {
      "name": "Budi Santoso Baru",
      "phone": "081299998888",
      "address": "Jl. Melati No. 99, Jakarta"
    }
    ```

-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Profil Anda berhasil diperbarui",
      "user": {
        "id": 5,
        "name": "Budi Santoso Baru",
        "email": "budi.santoso@example.com",
        "phone": "081299998888",
        "address": "Jl. Melati No. 99, Jakarta"
      }
    }
    ```

---

## 2. Manajemen Kategori Obat (`/api/categories`)

### Mengambil Semua Kategori
-   **URL:** `/categories`
-   **Method:** `GET`
-   **Akses:** Public
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 1,
          "name": "Obat Bebas",
          "desc": "Obat yang dapat dibeli bebas tanpa resep dokter",
          "createdAt": "2026-07-12T14:00:00.000Z",
          "updatedAt": "2026-07-12T14:00:00.000Z"
        }
      ]
    }
    ```

---

### Mengambil Kategori Berdasarkan ID
-   **URL:** `/categories/:id`
-   **Method:** `GET`
-   **Akses:** Public
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "id": 1,
        "name": "Obat Bebas",
        "desc": "Obat yang dapat dibeli bebas tanpa resep dokter",
        "createdAt": "2026-07-12T14:00:00.000Z",
        "updatedAt": "2026-07-12T14:00:00.000Z"
      }
    }
    ```

-   **Response Gagal (404 Not Found):**
    ```json
    {
      "message": "Kategori tidak ditemukan"
    }
    ```

---

### Membuat Kategori Baru
-   **URL:** `/categories`
-   **Method:** `POST`
-   **Akses:** Terautentikasi (Admin)
-   **Request Body:**
    ```json
    {
      "name": "Obat Keras",
      "desc": "Obat harus dengan resep dokter ditandai lingkaran merah lingkaran hitam"
    }
    ```

-   **Response Sukses (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Kategori berhasil ditambahkan",
      "data": {
        "id": 2,
        "name": "Obat Keras",
        "desc": "Obat harus dengan resep dokter ditandai lingkaran merah lingkaran hitam",
        "updatedAt": "2026-07-13T10:00:00.000Z",
        "createdAt": "2026-07-13T10:00:00.000Z"
      }
    }
    ```

---

### Memperbarui Kategori
-   **URL:** `/categories/:id`
-   **Method:** `PUT`
-   **Akses:** Terautentikasi (Admin)
-   **Request Body:**
    ```json
    {
      "name": "Obat Keras Terbatas",
      "desc": "Obat keras yang bebas dibeli dalam jumlah tertentu"
    }
    ```

-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Kategori berhasil diperbarui",
      "data": {
        "id": 2,
        "name": "Obat Keras Terbatas",
        "desc": "Obat keras yang bebas dibeli dalam jumlah tertentu",
        "createdAt": "2026-07-13T10:00:00.000Z",
        "updatedAt": "2026-07-13T10:15:00.000Z"
      }
    }
    ```

---

### Menghapus Kategori
Menghapus kategori jika tidak ada obat yang bersangkutan (relasi MySQL RESTRICT).

-   **URL:** `/categories/:id`
-   **Method:** `DELETE`
-   **Akses:** Terautentikasi (Admin)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Kategori berhasil dihapus"
    }
    ```

---

## 3. Manajemen Obat & Batch Stok (`/api/medicines`)

### Mengambil Semua Obat
Mendukung pencarian nama obat dan penyaringan berdasarkan ID kategori.

-   **URL:** `/medicines`
-   **Method:** `GET`
-   **Akses:** Public
-   **Query Parameters (Opsional):**
    -   `search`: Mencari nama obat (contoh: `/medicines?search=paracetamol`).
    -   `category_id`: Menyaring berdasarkan ID kategori tertentu (contoh: `/medicines?category_id=1`).
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 1,
          "category_id": 1,
          "name": "Paracetamol 500mg",
          "desc": "Pereda demam dan sakit kepala ringan",
          "price": 5000,
          "SKU_code": "SKU-PCT-500",
          "status": "in stock",
          "image": "http://example.com/images/pct.jpg",
          "createdAt": "2026-07-12T14:10:00.000Z",
          "updatedAt": "2026-07-12T14:10:00.000Z",
          "Category": {
            "id": 1,
            "name": "Obat Bebas"
          },
          "batches": [
            {
              "id": 1,
              "medicine_id": 1,
              "batch_number": "BATCH-001",
              "expiry_date": "2027-12-31",
              "stock": 150
            }
          ]
        }
      ]
    }
    ```

---

### Mengambil Obat Berdasarkan ID
-   **URL:** `/medicines/:id`
-   **Method:** `GET`
-   **Akses:** Public
-   **Response Sukses (200 OK):**
    *Struktur response sama seperti di atas namun hanya mengembalikan 1 object di dalam field `data`.*

---

### Membuat Obat Baru (Master Data)
-   **URL:** `/medicines`
-   **Method:** `POST`
-   **Akses:** Terautentikasi (Admin)
-   **Request Body:**
    ```json
    {
      "category_id": 1,
      "name": "Amoxicillin 500mg",
      "desc": "Antibiotik spektrum luas",
      "price": 12000,
      "SKU_code": "SKU-AMX-500",
      "status": "in stock",
      "image": null
    }
    ```
    *Status dapat bernilai: `"in stock"`, `"low"`, atau `"out of stock"`.*

-   **Response Sukses (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Data obat berhasil ditambahkan",
      "data": {
        "id": 2,
        "category_id": 1,
        "name": "Amoxicillin 500mg",
        "desc": "Antibiotik spektrum luas",
        "price": 12000,
        "SKU_code": "SKU-AMX-500",
        "status": "in stock",
        "image": null,
        "createdAt": "2026-07-13T11:00:00.000Z",
        "updatedAt": "2026-07-13T11:00:00.000Z"
      }
    }
    ```

---

### Memperbarui Data Obat
-   **URL:** `/medicines/:id`
-   **Method:** `PUT`
-   **Akses:** Terautentikasi (Admin)
-   **Request Body:** *(Kirim field yang ingin diubah saja)*
    ```json
    {
      "price": 12500,
      "status": "low"
    }
    ```

-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Data obat berhasil diperbarui",
      "data": {
        "id": 2,
        "price": 12500,
        "status": "low"
        // ... (field lainnya tetap)
      }
    }
    ```

---

### Menghapus Data Obat
-   **URL:** `/medicines/:id`
-   **Method:** `DELETE`
-   **Akses:** Terautentikasi (Admin)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Data obat berhasil dihapus dari sistem"
    }
    ```

---

### Tambah Batch / Kloter Stok Baru
Untuk mencatat stok masuk baru dengan nomor batch dan tanggal kedaluwarsa tertentu.

-   **URL:** `/medicines/batches`
-   **Method:** `POST`
-   **Akses:** Terautentikasi (Admin)
-   **Request Body:**
    ```json
    {
      "medicine_id": 2,
      "batch_number": "BATCH-AMX-01",
      "expiry_date": "2028-06-30",
      "stock": 300
    }
    ```

-   **Response Sukses (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Kloter stok (batch) baru berhasil ditambahkan",
      "data": {
        "id": 2,
        "medicine_id": 2,
        "batch_number": "BATCH-AMX-01",
        "expiry_date": "2028-06-30",
        "stock": 300,
        "createdAt": "2026-07-13T11:10:00.000Z",
        "updatedAt": "2026-07-13T11:10:00.000Z"
      }
    }
    ```

---

### Memperbarui Batch Stok
-   **URL:** `/medicines/batches/:batchId`
-   **Method:** `PUT`
-   **Akses:** Terautentikasi (Admin)
-   **Request Body:**
    ```json
    {
      "stock": 250,
      "batch_number": "BATCH-AMX-01-REV"
    }
    ```

-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Kloter stok (batch) berhasil diperbarui",
      "data": {
        "id": 2,
        "medicine_id": 2,
        "batch_number": "BATCH-AMX-01-REV",
        "expiry_date": "2028-06-30",
        "stock": 250
      }
    }
    ```

---

### Menghapus Batch Stok
-   **URL:** `/medicines/batches/:batchId`
-   **Method:** `DELETE`
-   **Akses:** Terautentikasi (Admin)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Kloter stok (batch) berhasil dihapus"
    }
    ```

---

## 4. Keranjang Belanja (`/api/cart`)

Seluruh aksi pada keranjang belanja akan langsung diasosiasikan dengan `user_id` dari token JWT pembeli yang sedang login.

### Tambah Obat ke Keranjang
Jika obat sudah ada di keranjang, kuantitas akan otomatis dijumlahkan (*update akumulatif*).

-   **URL:** `/cart`
-   **Method:** `POST`
-   **Akses:** Terautentikasi (User)
-   **Request Body:**
    ```json
    {
      "medicine_id": 1,
      "quantity": 3
    }
    ```

-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Obat berhasil dimasukkan ke keranjang",
      "data": {
        "id": 1,
        "user_id": 5,
        "medicine_id": 1,
        "quantity": 3
      }
    }
    ```

---

### Lihat Isi Keranjang Belanja
-   **URL:** `/cart`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (User)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 1,
          "user_id": 5,
          "medicine_id": 1,
          "quantity": 3,
          "Medicine": {
            "id": 1,
            "name": "Paracetamol 500mg",
            "price": 5000,
            "SKU_code": "SKU-PCT-500",
            "image": "http://example.com/images/pct.jpg",
            "status": "in stock"
          }
        }
      ]
    }
    ```

---

### Ubah Kuantitas Item di Keranjang
-   **URL:** `/cart/:id`
-   **Method:** `PUT`
-   **Akses:** Terautentikasi (User)
-   **Request Body:**
    ```json
    {
      "quantity": 5
    }
    ```

-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Kuantitas keranjang berhasil diperbarui",
      "data": {
        "id": 1,
        "quantity": 5
        // ... (data lainnya)
      }
    }
    ```

---

### Hapus Satu Item dari Keranjang
-   **URL:** `/cart/:id`
-   **Method:** `DELETE`
-   **Akses:** Terautentikasi (User)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Item berhasil dihapus dari keranjang"
    }
    ```

---

### Kosongkan Seluruh Keranjang
-   **URL:** `/cart`
-   **Method:** `DELETE`
-   **Akses:** Terautentikasi (User)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Seluruh isi keranjang belanja berhasil dikosongkan"
    }
    ```

---

## 5. Transaksi & POS Kasir (`/api/checkout` & `/api/orders`)

Sistem mendukung transaksi **Online** (menggunakan Midtrans Payment Gateway + Pengiriman Kurir) dan transaksi **Offline** (dicatat oleh Admin/Kasir di toko secara cash). Pengurangan stok otomatis menggunakan algoritma **FEFO** (First Expired First Out).

### Transaksi Checkout Online
Dipakai oleh pelanggan (Mobile App/Web) untuk membeli obat secara online.

-   **URL:** `/checkout/online`
-   **Method:** `POST`
-   **Akses:** Terautentikasi (User)
-   **Request Body:**
    ```json
    {
      "items": [
        {
          "medicine_id": 1,
          "quantity": 2
        }
      ],
      "shipping_cost": 10000,
      "shipping_address": "Jl. Mangga No. 23, Kebon Jeruk, Jakarta",
      "latitude": -6.193425,
      "longitude": 106.784534,
      "distance": 3.5
    }
    ```

-   **Response Sukses (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Order online berhasil dibuat",
      "order_id": 12,
      "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/453b3b24-..."
    }
    ```

-   **Response Gagal - Stok Kurang (400 Bad Request):**
    ```json
    {
      "message": "Stok obat Paracetamol 500mg tidak mencukupi!"
    }
    ```

---

### Transaksi POS Kasir Offline
Dipakai oleh Admin/Kasir untuk melayani pembelian langsung (walk-in customer) di toko. Pembayaran langsung ditandai `"success"` dan pesanan berstatus `"completed"`.

-   **URL:** `/checkout/offline`
-   **Method:** `POST`
-   **Akses:** Terautentikasi (Admin)
-   **Request Body:**
    ```json
    {
      "customer_name": "Rian Wijaya",
      "items": [
        {
          "medicine_id": 1,
          "quantity": 2
        }
      ],
      "payment_method": "CASH",
      "amount_paid": 50000
    }
    ```

-   **Response Sukses (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Transaksi kasir offline berhasil disimpan",
      "order_id": 13,
      "change": 40000
    }
    ```
    *`change` adalah uang kembalian.*

---

### Ambil Semua Riwayat Transaksi (Sisi Admin)
Mendapatkan list seluruh transaksi yang terjadi di sistem apotek.

-   **URL:** `/orders`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (Admin)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 13,
          "user_id": null,
          "admin_id": null,
          "total_items_price": 10000,
          "shipping_cost": 0,
          "total_payment": 10000,
          "order_status": "completed",
          "payment_status": "paid",
          "createdAt": "2026-07-13T12:00:00.000Z",
          "updatedAt": "2026-07-13T12:00:00.000Z",
          "customer": null,
          "items": [
            {
              "id": 20,
              "order_id": 13,
              "medicine_id": 1,
              "quantity": 2,
              "price_at_purchase": 5000,
              "Medicine": {
                "id": 1,
                "name": "Paracetamol 500mg",
                "price": 5000
              }
            }
          ],
          "Shipping": null,
          "Payments": [
            {
              "id": 15,
              "payment_method": "CASH",
              "amount": 10000,
              "payment_status": "success",
              "transaction_reference": "POS-13-178652345"
            }
          ]
        }
      ]
    }
    ```

---

### Ambil Riwayat Belanja Saya (Sisi Pelanggan)
Mendapatkan riwayat pesanan milik user yang sedang terautentikasi.

-   **URL:** `/orders/my-history`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (User)
-   **Response Sukses (200 OK):**
    *Struktur data array orderan sama seperti di atas, disaring khusus milik pelanggan bersangkutan.*

---

### Ambil Detail Satu Transaksi
-   **URL:** `/orders/:id`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (User / Admin)
-   **Response Sukses (200 OK):**
    *Mengembalikan 1 detail object order lengkap dengan relasi item, shipping, dan payment.*

---

### Mengubah Status Pesanan
Digunakan Admin untuk memperbarui status pemrosesan pesanan (misal: membatalkan, memproses, menyerahkan ke kurir).

-   **URL:** `/orders/:id/status`
-   **Method:** `PUT`
-   **Akses:** Terautentikasi (Admin)
-   **Request Body:**
    ```json
    {
      "order_status": "processing"
    }
    ```
    *Status pesanan yang didukung: `"pending"`, `"processing"`, `"completed"`, `"cancelled"`.*

-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Status pesanan berhasil diubah menjadi processing",
      "data": {
        "id": 12,
        "order_status": "processing"
        // ... (data lainnya)
      }
    }
    ```

---

## 6. Webhook Midtrans (`/api/webhooks/midtrans`)

Menerima callback/notifikasi otomatis dari sistem Midtrans Snap API ketika pembayaran selesai dilakukan oleh pembeli.

-   **URL:** `/webhooks/midtrans`
-   **Method:** `POST`
-   **Akses:** Public (Dipanggil secara aman oleh server Midtrans)
-   **Request Body:** Payload standar notification JSON dari Midtrans API.
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "OK",
      "message": "Webhook Midtrans berhasil diproses"
    }
    ```
    *Efek Samping: Jika pembayaran berhasil (`settlement`), status pembayaran diubah menjadi `"paid"` dan status pesanan menjadi `"processing"`. Jika gagal (`deny`, `cancel`, `expire`), status pembayaran menjadi `"failed"` dan pesanan dibatalkan (`cancelled`).*

---

## 7. Logistik Pengiriman (`/api/shipping`)

Digunakan oleh kurir untuk memantau pengantaran obat ke alamat pembeli secara realtime.

### Mengambil Lowongan Pengiriman yang Tersedia (*Shipping Jobs*)
Mendapatkan semua daftar pengiriman pesanan yang berstatus pending dan siap di-pickup oleh kurir mana pun.

-   **URL:** `/shipping/jobs`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (Kurir)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 3,
          "order_id": 12,
          "courier_id": null,
          "distance": 3.5,
          "shipping_address": "Jl. Mangga No. 23, Kebon Jeruk, Jakarta",
          "latitude": -6.193425,
          "longitude": 106.784534,
          "shipping_status": "pending",
          "Order": {
            "id": 12,
            "order_status": "processing",
            "User": {
              "id": 5,
              "name": "Budi Santoso",
              "phone": "081234567890"
            }
          }
        }
      ]
    }
    ```

---

### Mengambil Daftar Tugas Pengantaran Saya
Melihat daftar pengantaran yang dipegang oleh kurir yang sedang login.

-   **URL:** `/shipping/my-shipments`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (Kurir)
-   **Response Sukses (200 OK):**
    *Mengembalikan array data shipping yang memiliki `courier_id` sesuai kurir bersangkutan.*

---

### Mengambil Alih Tugas Pengantaran (*Pickup*)
Kurir mengambil alih tugas pengiriman pesanan tertentu (status pengiriman berubah menjadi `"shipping"` / `"on_the_way"`, status order utama ikut berubah menjadi `"shipping"`).

-   **URL:** `/shipping/:id/pickup`
-   **Method:** `PUT`
-   **Akses:** Terautentikasi (Kurir)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Pesanan berhasil diambil! Selamat bertugas di jalan",
      "data": {
        "id": 3,
        "courier_id": 6,
        "shipping_status": "pickup" 
      }
    }
    ```

---

### Memperbarui Status Pengantaran
Kurir memperbarui status pengiriman setelah sampai di tujuan.

-   **URL:** `/shipping/:id/status`
-   **Method:** `PUT`
-   **Akses:** Terautentikasi (Kurir)
-   **Request Body:**
    ```json
    {
      "shipping_status": "delivered"
    }
    ```
    *Pilihan status pengiriman yang disubmit kurir: `"delivered"` atau `"failed"`.*

-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Status pengiriman berhasil diperbarui menjadi: delivered",
      "data": {
        "id": 3,
        "shipping_status": "delivered",
        "delivered_at": "2026-07-13T13:30:00.000Z"
      }
    }
    ```
    *Efek Samping: Jika status `"delivered"`, status order induk akan otomatis menjadi `"completed"`. Jika status `"failed"`, status order induk menjadi `"failed"`.*

---

## 8. Layanan Chat CS (`/api/chats`)

Sistem chat dua arah antara Pelanggan (User) dengan Admin Apotek untuk konsultasi obat atau penanganan pesanan.

### Mengirim Pesan Chat
Dapat digunakan oleh Pelanggan maupun Admin. Jika pelanggan baru mengirim pesan pertama, ruang obrolan (*ChatRoom*) baru akan dibuat secara otomatis.

-   **URL:** `/chats/message`
-   **Method:** `POST`
-   **Akses:** Terautentikasi (User / Admin)
-   **Request Body (Bila Pengirim adalah Pelanggan):**
    ```json
    {
      "message": "Halo min, apakah obat batuk herbalnya ready?"
    }
    ```
    *Catatan: Bagi pelanggan, sistem otomatis menempelkan pesan ke room milik user tersebut.*

-   **Request Body (Bila Pengirim adalah Admin):**
    ```json
    {
      "chat_room_id": 1,
      "message": "Halo kak, obat batuk herbalnya ready banyak ya"
    }
    ```

-   **Response Sukses (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Pesan berhasil dikirim",
      "data": {
        "id": 45,
        "chat_room_id": 1,
        "sender_id": 5,
        "message": "Halo min, apakah obat batuk herbalnya ready?"
      }
    }
    ```

---

### Mengambil Riwayat Chat Saya (Sisi Pelanggan)
Mendapatkan seluruh histori percakapan dari ruang obrolan pribadi pelanggan.

-   **URL:** `/chats/history`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (User)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 45,
          "chat_room_id": 1,
          "sender_id": 5,
          "message": "Halo min, apakah obat batuk herbalnya ready?",
          "createdAt": "2026-07-13T14:00:00.000Z",
          "User": {
            "id": 5,
            "name": "Budi Santoso",
            "role": "user"
          }
        }
      ]
    }
    ```

---

### Mengambil Daftar Room Chat Aktif (Sisi Admin)
Mendapatkan daftar seluruh ruang percakapan dari para pembeli yang diurutkan berdasarkan pesan terbaru.

-   **URL:** `/chats/admin/rooms`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (Admin)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 1,
          "user_id": 5,
          "last_message": "Halo min, apakah obat batuk herbalnya ready?",
          "createdAt": "2026-07-13T14:00:00.000Z",
          "updatedAt": "2026-07-13T14:00:00.000Z",
          "User": {
            "id": 5,
            "name": "Budi Santoso",
            "phone": "081234567890",
            "role": "user"
          }
        }
      ]
    }
    ```

---

### Mengambil Riwayat Chat Tertentu Berdasarkan Room ID (Sisi Admin)
-   **URL:** `/chats/admin/history/:roomId`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (Admin)
-   **Response Sukses (200 OK):**
    *Struktur response berupa array pesan di room terpilih.*

---

## 9. Sistem Notifikasi (`/api/notifications`)

Sistem pengiriman notifikasi/alert untuk mengingatkan pembeli dan pengelola apotek tentang aktivitas penting (pesanan baru, update status kiriman, stok obat menipis, atau kedaluwarsa batch).

### Mengambil Semua Notifikasi Saya
-   **URL:** `/notifications`
-   **Method:** `GET`
-   **Akses:** Terautentikasi (Semua Peran)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 4,
          "user_id": 5,
          "title": "Status Pengiriman Pesanan",
          "message": "Pesanan Anda dengan nomor #12 sedang diantar oleh kurir.",
          "type": "order_status",
          "is_read": false,
          "order_id": 12,
          "chat_id": null,
          "batch_id": null,
          "createdAt": "2026-07-13T13:00:00.000Z"
        }
      ]
    }
    ```
    *Jenis `type` notifikasi yang dapat dikembalikan: `"new_order"`, `"low_stock"`, `"near_expiry"`, `"chat"`, `"order_status"`.*

---

### Tandai Satu Notifikasi Telah Dibaca
-   **URL:** `/notifications/:id/read`
-   **Method:** `PUT`
-   **Akses:** Terautentikasi (Semua Peran)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Notifikasi berhasil ditandai sebagai telah dibaca",
      "data": {
        "id": 4,
        "is_read": true
        // ... (data lainnya)
      }
    }
    ```

---

### Tandai Semua Notifikasi Telah Dibaca
Mengubah semua status notifikasi belum terbaca (`is_read: false`) milik user saat ini menjadi terbaca (`is_read: true`).

-   **URL:** `/notifications/read-all`
-   **Method:** `PUT`
-   **Akses:** Terautentikasi (Semua Peran)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Semua notifikasi berhasil ditandai sebagai telah dibaca"
    }
    ```

---

### Menghapus Notifikasi
-   **URL:** `/notifications/:id`
-   **Method:** `DELETE`
-   **Akses:** Terautentikasi (Semua Peran)
-   **Response Sukses (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Notifikasi berhasil dihapus"
    }
    ```
