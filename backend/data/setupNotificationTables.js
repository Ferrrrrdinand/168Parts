require('dotenv').config();
const dbManager = require('../src/config/database');

async function setupNotifications() {
  await dbManager.init();
  console.log('⚡ Menyiapkan tabel broadcasts & notifications di Supabase...');

  await dbManager.query(`
    CREATE TABLE IF NOT EXISTS public.broadcasts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT DEFAULT 'promo',
      icon TEXT DEFAULT '📢',
      target_audience TEXT DEFAULT 'all',
      action_url TEXT DEFAULT '',
      action_label TEXT DEFAULT 'Lihat Promo',
      sent_by TEXT DEFAULT 'Admin 168 Parts',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await dbManager.query(`
    CREATE TABLE IF NOT EXISTS public.user_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      broadcast_id TEXT NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await dbManager.query(`
    CREATE INDEX IF NOT EXISTS idx_broadcasts_created ON public.broadcasts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_notif_user ON public.user_notifications(user_id, is_read);
  `);

  // Enable RLS & Policies
  await dbManager.query(`
    ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public access broadcasts" ON public.broadcasts;
    CREATE POLICY "Public access broadcasts" ON public.broadcasts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access user_notifications" ON public.user_notifications;
    CREATE POLICY "Public access user_notifications" ON public.user_notifications FOR ALL USING (true) WITH CHECK (true);
  `);

  // Buat contoh data broadcast awal jika belum ada
  const countRes = await dbManager.query('SELECT count(*) FROM public.broadcasts');
  if (countRes && countRes[0] && Number(countRes[0].count) === 0) {
    await dbManager.query(`
      INSERT INTO public.broadcasts (id, title, message, category, icon, action_url, action_label, sent_by, created_at)
      VALUES 
      ('bc-welcome-168', '🎉 Sambut Promo Terbaik 168 Parts Surabaya!', 'Nikmati diskon s.d 80%, cashback kilat 50%, dan gratis ongkir se-Indonesia khusus seluruh member terdaftar. Segera klaim voucher belanja sebelum kuota habis!', 'promo', '🎟️', '#/promos', 'Klaim Voucher Belanja', 'Admin 168 Parts', NOW()),
      ('bc-lcd-restock', '📦 Restok Sparepart LCD iPhone & Samsung Grade A+ Mantap!', 'Stok baru LCD iPhone 11, iPhone X OLED Hard GX, serta LCD Samsung A51 kini telah tersedia di etalase toko. Siap kirim cepat ke seluruh teknisi!', 'info', '📱', '#/search?category=LCD+%26+Layar', 'Lihat Produk LCD', 'Admin 168 Parts', NOW() - INTERVAL '2 hours')
    `);
    console.log('✅ Seed awal broadcast pengumuman berhasil ditambahkan.');
  }

  console.log('✅ Tabel broadcasts & user_notifications berhasil disiapkan di Supabase Cloud!');
  process.exit(0);
}

setupNotifications().catch(err => {
  console.error('❌ Gagal menyiapkan tabel notifications:', err);
  process.exit(1);
});
