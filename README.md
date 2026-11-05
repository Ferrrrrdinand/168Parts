# 168Parts - Modern Marketplace Platform

Platform e-commerce modern dengan arsitektur modular, RESTful API backend Node.js & Express, dukungan multi-database (**Supabase Cloud PostgreSQL**, **SQLite Lokal**, dan **MySQL**), sistem autentikasi (Login & Register), keranjang belanja realtime, manajemen promo & voucher, serta antarmuka interaktif yang responsif.

---

## ⚡ Panduan Menghubungkan ke Supabase (Cloud Database)

Aplikasi ini sudah siap dihubungkan langsung ke database cloud **Supabase**:

### 1. Buat Project di Supabase
1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Tunggu beberapa saat hingga database project Anda siap.

### 2. Jalankan Skema Database di Supabase
1. Di dashboard Supabase, buka menu **SQL Editor** di sidebar kiri.
2. Buka file [`backend/data/supabase_schema.sql`](./backend/data/supabase_schema.sql) pada project ini, lalu salin seluruh kodenya.
3. Paste ke dalam SQL Editor Supabase dan klik tombol **Run**.
   - Ini akan otomatis membuat tabel `products`, `promos`, `users`, `orders`, `carts`, dan `banners`, lengkap dengan indeks, data awal produk, serta kebijakan akses (RLS).

### 3. Konfigurasi File `.env`
Buka file `.env` di root project, lalu isi kredensial Supabase Anda:

```env
# Aktifkan mode Supabase
DB_TYPE=supabase

# Ambil dari menu Project Settings -> API di Supabase Dashboard:
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_KEY=[YOUR-SUPABASE-ANON-OR-SERVICE-KEY]

# (Opsional) Connection String PostgreSQL Supabase:
# Ambil dari menu Project Settings -> Database -> Connection String (URI):
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
```

### 4. Seeding Data Otomatis ke Supabase
Untuk memasukkan seluruh katalog produk awal dan kode promo ke Supabase Cloud, jalankan:

```bash
npm run seed:supabase
```

---

## 📦 Mode Database Lainnya

Aplikasi ini mendukung pergantian engine database secara mudah melalui file `.env`:

### 1. SQLite Lokal (Default - Siap Pakai Tanpa Setup)
Tidak memerlukan install server database. Langsung aktif dan menyimpan data ke file `backend/data/pasarin_local.db`:
```env
DB_TYPE=sqlite
SQLITE_FILE=./backend/data/pasarin_local.db
```

### 2. MySQL (Server Lokal seperti XAMPP / Laragon)
```env
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=pasarin_db
```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Install Dependensi
```bash
npm install
```

### 2. Jalankan Server Backend & Web
```bash
npm start
```
*(Atau gunakan `npm run dev`)*

Aplikasi dapat diakses di:
- 🌐 **Halaman Utama Marketplace:** [http://localhost:3000](http://localhost:3000)
- ⚙️ **Admin Dashboard & CRUD:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
- 🔐 **Halaman Login & Register:** [http://localhost:3000/login.html](http://localhost:3000/login.html)
- 📡 **REST API Base URL:** [http://localhost:3000/api](http://localhost:3000/api)

---

## 🔑 Akun Demo Siap Pakai

Tersedia tombol **Coba Cepat** di halaman [login.html](http://localhost:3000/login.html) untuk auto-fill:

1. **Akun Pembeli (Buyer):**
   - **Email:** `demo@pasarin.com`
   - **Password:** `demo123`
2. **Akun Admin (Seller Centre):**
   - **Email:** `admin@pasarin.com`
   - **Password:** `admin123`

---

## ⚙️ Fitur Admin & Seller Centre (CRUD)

- Akses melalui [http://localhost:3000/admin.html](http://localhost:3000/admin.html) atau klik menu profil admin.
- **Katalog Produk:** Tambah produk baru, edit harga/stok/detail, dan hapus produk.
- **Promo & Voucher:** Tambah kode voucher, kelola kuota, diskon, dan aktifkan/nonaktifkan promo.
- **Manajemen Pesanan:** Update status pengiriman pesanan pembeli.
- **Pengaturan Banner:** Kostumisasi banner promosi dan banner flash sale di beranda.

---

## 📡 Daftar REST API Utama

- `GET    /api/health`              : Cek status kesehatan server
- `POST   /api/auth/register`       : Registrasi pengguna baru
- `POST   /api/auth/login`          : Autentikasi dan penerbitan token JWT
- `GET    /api/auth/me`             : Mengambil profil pengguna yang sedang login
- `GET    /api/products`            : Daftar produk (filter kategori, harga, rating, search)
- `GET    /api/products/:id`        : Detail produk spesifik
- `POST   /api/products`            : Tambah produk baru (Admin/Seller)
- `PUT    /api/products/:id`        : Perbarui data produk
- `DELETE /api/products/:id`        : Hapus produk
- `GET    /api/promos`              : Daftar promo aktif
- `POST   /api/promos/validate`     : Validasi kode promo dan hitung potongan harga
- `GET    /api/cart`                : Ambil item keranjang belanja
- `POST   /api/cart`                : Tambah item ke keranjang
- `POST   /api/orders/checkout`     : Proses checkout pesanan

---

## 📁 Struktur Direktori

```text
168Parts/
├── package.json              # Dependensi npm & script
├── README.md                 # Dokumentasi proyek
├── .env.example              # Template variabel lingkungan
├── backend/
│   ├── data/
│   │   ├── seedProducts.js   # Data awal produk
│   │   ├── supabase_schema.sql # Skema PostgreSQL untuk Supabase
│   │   ├── seedSupabase.js   # Script seeder otomatis Supabase
│   │   └── schema.sql        # Skema MySQL
│   └── src/
│       ├── config/
│       │   ├── database.js   # Manager multi-database (Supabase/SQLite/MySQL)
│       │   └── config.js
│       ├── controllers/      # Controller bisnis logic
│       ├── middleware/       # Middleware autentikasi
│       ├── models/           # Data models (Product, Promo, Storage)
│       ├── routes/           # Router endpoints
│       └── server.js         # Entry point server Express
└── frontend/                 # Frontend SPA responsif
    ├── index.html            # Halaman utama marketplace
    ├── admin.html            # Dashboard admin & seller centre
    ├── login.html            # Login & registrasi
    ├── css/                  # Styling & responsiveness
    └── js/                   # Logika antarmuka & client API
```
