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

