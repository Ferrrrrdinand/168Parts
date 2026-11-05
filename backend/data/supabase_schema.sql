-- ========================================================
-- 168Parts / Pasarin Marketplace - Supabase PostgreSQL Schema
-- ========================================================
-- Panduan:
-- 1. Buka dashboard Supabase (https://supabase.com)
-- 2. Pilih project Anda -> Buka menu "SQL Editor"
-- 3. Paste seluruh isi file ini dan klik "Run"
-- ========================================================

-- Aktifkan ekstensi UUID (bawaan Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PRODUK (products)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(14,2) NOT NULL,
  original_price NUMERIC(14,2),
  discount_percent INT DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 5.0,
  sold_count INT DEFAULT 0,
  stock INT DEFAULT 10,
  location TEXT DEFAULT 'Indonesia',
  shop_name TEXT DEFAULT '168Parts Official',
  shop_type TEXT DEFAULT 'Star',
  icon TEXT DEFAULT 'bag',
  image TEXT,
  bg_pattern TEXT DEFAULT '#f8fafc',
  is_flash_sale BOOLEAN DEFAULT FALSE,
  flash_sale_sold INT DEFAULT 0,
  description TEXT,
  specs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_products_flash_sale ON public.products (is_flash_sale);

-- 2. TABEL PROMO & VOUCHER (promos)
CREATE TABLE IF NOT EXISTS public.promos (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC(14,2) NOT NULL,
  min_spend NUMERIC(14,2) DEFAULT 0,
  max_discount NUMERIC(14,2),
  quota INT DEFAULT 100,
  used_count INT DEFAULT 0,
  category TEXT DEFAULT 'diskon',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PENGGUNA (users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  coordinates JSONB,
  role TEXT DEFAULT 'buyer',
  points INT DEFAULT 0,
  salt TEXT NOT NULL,
  hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL PESANAN (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  items JSONB NOT NULL,
  shipping_address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  total_amount NUMERIC(14,2) NOT NULL,
  earned_points INT DEFAULT 0,
  status TEXT DEFAULT 'Sedang Diproses',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);

-- 5. TABEL KERANJANG (carts)
CREATE TABLE IF NOT EXISTS public.carts (
  id BIGSERIAL PRIMARY KEY,
  owner_key TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INT DEFAULT 1,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_owner_product UNIQUE (owner_key, product_id)
);

CREATE INDEX IF NOT EXISTS idx_carts_owner ON public.carts (owner_key);

-- 6. TABEL BANNERS (banners)
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- KEAMANAN: Row Level Security (RLS)
-- Untuk kemudahan uji coba dan API Node.js backend:
-- Aktifkan RLS dengan policy akses publik / anon.
-- ========================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Policy read & write publik untuk API backend & uji coba
DROP POLICY IF EXISTS "Public access products" ON public.products;
CREATE POLICY "Public access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access promos" ON public.promos;
CREATE POLICY "Public access promos" ON public.promos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access users" ON public.users;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access orders" ON public.orders;
CREATE POLICY "Public access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access carts" ON public.carts;
CREATE POLICY "Public access carts" ON public.carts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access banners" ON public.banners;
CREATE POLICY "Public access banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- DATA AWAL (SEEDING PROMOS)
-- ========================================================
INSERT INTO public.promos (code, title, description, discount_type, discount_value, min_spend, max_discount, quota, used_count, category, is_active)
VALUES 
  ('PASARINBARU', 'Voucher Pengguna Baru', 'Diskon 100% s.d Rp100.000', 'fixed', 100000, 0, 100000, 150, 0, 'diskon', TRUE),
  ('ONGKIRXTRA', 'Gratis Ongkir Xtra Se-Indonesia', 'Subsidi ongkir s.d Rp50.000', 'fixed', 50000, 30000, 50000, 500, 0, 'ongkir', TRUE),
  ('FLASHSALE80', 'Flash Sale Kilat Super Murah', 'Diskon ekstra s.d 80%', 'percent', 80, 50000, 200000, 50, 0, 'diskon', TRUE),
  ('CASHBACK50', 'Cashback Kilat 50% PasarinPay', 'Cashback Koin s.d Rp50.000', 'percent', 50, 50000, 50000, 100, 0, 'cashback', TRUE),
  ('PILIHLOKAL', 'Bangga Buatan Lokal (UMKM)', 'Potongan langsung Rp25.000 khusus UMKM', 'fixed', 25000, 75000, 25000, 200, 0, 'lokal', TRUE),
  ('GAJIANHEMAT', 'Ekstra Diskon Gajian (Payday Sale)', 'Ekstra potongan 15% semua kategori', 'percent', 15, 150000, 150000, 100, 0, 'diskon', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ========================================================
-- DATA AWAL (SEEDING PRODUK CONTOH)
-- ========================================================
INSERT INTO public.products (id, name, slug, category, price, original_price, discount_percent, rating, sold_count, stock, location, shop_name, shop_type, icon, image, bg_pattern, is_flash_sale, flash_sale_sold, description, specs)
VALUES
('prod-1', 'DJI Osmo Action 4 Standard Combo 4K/120fps', 'dji-osmo-action-4-standard-combo', 'Fotografi', 3940000, 4899000, 20, 4.9, 1420, 45, 'Jakarta Barat', 'DJI Official Store', 'Mall', 'cam', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80', '#f1f5f9', TRUE, 85, 'Kamera aksi dengan sensor besar 1/1.3 inci, performa low-light luar biasa.', '["Sensor: 1/1.3 inci CMOS", "Video: 4K/120fps", "Tahan Air: 18m"]'::jsonb),
('prod-2', 'iPhone 12 256GB Garansi Resmi iBox Indonesia', 'iphone-12-256gb', 'HP & Aksesoris', 3599000, 4500000, 20, 4.8, 980, 20, 'Jakarta Selatan', 'Apple Authorized Store', 'Mall', 'phone', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format&fit=crop&q=80', '#f8fafc', TRUE, 92, 'Layar Super Retina XDR 6.1 inci yang indah dengan Ceramic Shield.', '["Chip: A14 Bionic", "Layar: 6.1 OLED", "Penyimpanan: 256GB"]'::jsonb),
('prod-3', 'Smartwatch Ultra Series 9 Titanium Smart Fitness', 'smartwatch-ultra-series-9', 'Jam Tangan', 489000, 799000, 39, 4.7, 3120, 120, 'Kota Surabaya', 'TechWear ID', 'Star+', 'watch', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80', '#fafaf9', TRUE, 78, 'Smartwatch tangguh berbahan bodi titanium dengan layar AMOLED jernih.', '["Layar: AMOLED 2.02 inci", "Baterai: Hingga 7 hari"]'::jsonb),
('prod-4', 'Headphone Wireless Noise Cancelling ANC Pro Bass', 'headphone-wireless-anc-pro', 'Elektronik', 349000, 699000, 50, 4.8, 2450, 80, 'Jakarta Utara', 'AudioTech Official', 'Mall', 'head', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80', '#f1f5f9', TRUE, 65, 'Headphone over-ear bluetooth dengan fitur Active Noise Cancellation.', '["Bluetooth: v5.3", "Battery Life: 40 Jam"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
