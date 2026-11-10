require('dotenv').config();
const dbManager = require('../src/config/database');

async function setupChat() {
  await dbManager.init();
  console.log('⚡ Membuat tabel chat di Supabase PostgreSQL...');

  await dbManager.query(`
    CREATE TABLE IF NOT EXISTS public.chat_rooms (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      customer_name TEXT DEFAULT 'Pelanggan 168',
      customer_email TEXT,
      customer_phone TEXT,
      last_message TEXT,
      last_message_at TIMESTAMPTZ DEFAULT NOW(),
      status TEXT DEFAULT 'ai_active',
      unread_admin INT DEFAULT 0,
      unread_user INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await dbManager.query(`
    CREATE TABLE IF NOT EXISTS public.chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
      sender_type TEXT NOT NULL,
      sender_name TEXT,
      message TEXT NOT NULL,
      actions JSONB DEFAULT '[]'::jsonb,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await dbManager.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON public.chat_rooms(status);
    CREATE INDEX IF NOT EXISTS idx_chat_rooms_updated ON public.chat_rooms(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id, created_at ASC);
  `);

  // Aktifkan RLS & Policies
  await dbManager.query(`
    ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public access chat_rooms" ON public.chat_rooms;
    CREATE POLICY "Public access chat_rooms" ON public.chat_rooms FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access chat_messages" ON public.chat_messages;
    CREATE POLICY "Public access chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
  `);

  console.log('✅ Tabel chat_rooms & chat_messages berhasil dibuat di Supabase!');
  process.exit(0);
}

setupChat().catch(err => {
  console.error('❌ Error setting up chat tables:', err);
  process.exit(1);
});

