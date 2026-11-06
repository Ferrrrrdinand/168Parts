-- ========================================================
-- Pasarin Indonesia - Database Schema (MySQL)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `pasarin_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `pasarin_db`;

-- 1. Tabel Produk (Products)
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `price` DECIMAL(14,2) NOT NULL,
  `original_price` DECIMAL(14,2) DEFAULT NULL,
  `discount_percent` INT DEFAULT 0,
  `rating` DECIMAL(2,1) DEFAULT 5.0,
  `sold_count` INT DEFAULT 0,
  `stock` INT DEFAULT 10,
  `location` VARCHAR(100) DEFAULT 'Indonesia',
  `shop_name` VARCHAR(150) DEFAULT 'Pasarin Partner',
  `shop_type` VARCHAR(50) DEFAULT 'Star',
  `icon` VARCHAR(50) DEFAULT 'bag',
  `image` TEXT DEFAULT NULL,
  `bg_pattern` VARCHAR(50) DEFAULT '#f8fafc',
  `is_flash_sale` TINYINT(1) DEFAULT 0,
  `flash_sale_sold` INT DEFAULT 0,
  `description` TEXT DEFAULT NULL,
  `specs` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_price` (`price`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Pengguna (Users)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT 'buyer',
  `salt` VARCHAR(255) NOT NULL,
  `hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Pesanan (Orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `items` JSON NOT NULL,
  `shipping_address` TEXT NOT NULL,
  `payment_method` VARCHAR(100) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `total_amount` DECIMAL(14,2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Sedang Diproses',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Voucher & Kode Promo (Promos)
CREATE TABLE IF NOT EXISTS `promos` (
  `code` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `discount_type` VARCHAR(32) NOT NULL,
  `discount_value` DECIMAL(14,2) NOT NULL,
  `min_spend` DECIMAL(14,2) DEFAULT 0,
  `max_discount` DECIMAL(14,2) DEFAULT NULL,
  `quota` INT DEFAULT 100,
  `used_count` INT DEFAULT 0,
  `category` VARCHAR(50) DEFAULT 'diskon',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel Pengaturan Banners (Banners)
CREATE TABLE IF NOT EXISTS `banners` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `config_json` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- DATA SEED AWAL (PROMO DEFAULT)
-- ========================================================
INSERT IGNORE INTO `promos` (`code`, `title`, `description`, `discount_type`, `discount_value`, `min_spend`, `max_discount`, `quota`, `category`, `is_active`)
VALUES 
  ('PASARINBARU', 'Voucher Pengguna Baru', 'Diskon 100% s.d Rp100.000', 'fixed', 100000, 0, 100000, 150, 'diskon', 1),
  ('ONGKIRXTRA', 'Gratis Ongkir Xtra Se-Indonesia', 'Subsidi ongkir s.d Rp50.000', 'fixed', 50000, 30000, 50000, 500, 'ongkir', 1),
  ('FLASHSALE80', 'Flash Sale Kilat Super Murah', 'Diskon ekstra s.d 80%', 'percent', 80, 50000, 200000, 50, 'diskon', 1),
  ('CASHBACK50', 'Cashback Kilat 50% PasarinPay', 'Cashback Koin s.d Rp50.000', 'percent', 50, 50000, 50000, 100, 'cashback', 1),
  ('PILIHLOKAL', 'Bangga Buatan Lokal (UMKM)', 'Potongan langsung Rp25.000 khusus UMKM', 'fixed', 25000, 75000, 25000, 200, 'lokal', 1),
  ('GAJIANHEMAT', 'Ekstra Diskon Gajian (Payday Sale)', 'Ekstra potongan 15% semua kategori', 'percent', 15, 150000, 150000, 100, 'diskon', 1);


