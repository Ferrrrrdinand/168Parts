const dbManager = require('../config/database');

// Helper memformat baris database menjadi objek broadcast yang rapi
function formatBroadcast(row, isRead = false) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    category: row.category || 'promo', // 'promo', 'info', 'order', 'system'
    icon: row.icon || '📢',
    target: row.target_audience || 'all',
    targetAudience: row.target_audience || 'all',
    action_url: row.action_url || '',
    actionUrl: row.action_url || '',
    action_label: row.action_label || 'Lihat Detail',
    actionLabel: row.action_label || 'Lihat Detail',
    sent_by: row.sent_by || 'Admin 168 Parts',
    sentBy: row.sent_by || 'Admin 168 Parts',
    is_read: Boolean(isRead),
    isRead: Boolean(isRead),
    created_at: row.created_at,
    createdAt: row.created_at
  };
}

// 1. Ambil seluruh notifikasi broadcast untuk member / pembeli
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.query.userId || (req.user ? req.user.id : null);

    // Ambil seluruh pesan broadcast dari toko
    const broadcasts = await dbManager.query(
      'SELECT * FROM public.broadcasts ORDER BY created_at DESC LIMIT 50'
    );

    let readMap = {};
    if (userId) {
      const readRows = await dbManager.query(
        'SELECT broadcast_id, is_read FROM public.user_notifications WHERE user_id = ?',
        [userId]
      );
      if (readRows && readRows.length > 0) {
        readRows.forEach(r => {
          readMap[r.broadcast_id] = Boolean(r.is_read);
        });
      }
    }

    const formattedList = (broadcasts || []).map(b => {
      const isRead = userId ? Boolean(readMap[b.id]) : false;
      return formatBroadcast(b, isRead);
    });

    const unreadCount = formattedList.filter(b => !b.isRead).length;

    return res.json({
      success: true,
      total: formattedList.length,
      unreadCount,
      unread_count: unreadCount,
      notifications: formattedList,
      data: formattedList
    });
  } catch (error) {
    console.error('Error getNotifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil notifikasi broadcast.',
      error: error.message
    });
  }
};

// 2. Admin mengirim pesan Broadcast ke seluruh member pengguna
exports.sendBroadcast = async (req, res) => {
  try {
    const body = req.body || {};
    const title = body.title;
    const message = body.message;
    const category = body.category || 'promo';
    const icon = body.icon;
    const actionUrl = body.action_url || body.actionUrl || '';
    const actionLabel = body.action_label || body.actionLabel || 'Lihat Detail';
    const targetAudience = body.target || body.target_audience || body.targetAudience || 'all';

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Judul pesan broadcast wajib diisi!'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Isi pesan broadcast wajib diisi!'
      });
    }

    const broadcastId = `bc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Tentukan icon bawaan berdasarkan kategori jika tidak disediakan
    let chosenIcon = icon;
    if (!chosenIcon) {
      if (category === 'promo') chosenIcon = '🎟️';
      else if (category === 'info') chosenIcon = '📦';
      else if (category === 'system') chosenIcon = '⚙️';
      else chosenIcon = '📢';
    }

    await dbManager.query(
      `INSERT INTO public.broadcasts (id, title, message, category, icon, target_audience, action_url, action_label, sent_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        broadcastId,
        title.trim(),
        message.trim(),
        category,
        chosenIcon,
        targetAudience,
        actionUrl ? actionUrl.trim() : '',
        actionLabel ? actionLabel.trim() : 'Lihat Detail',
        'Admin 168 Parts'
      ]
    );

    // Hitung total penerima member di database
    const usersCountRes = await dbManager.query('SELECT count(*) FROM public.users');
    const recipientCount = usersCountRes && usersCountRes[0] ? Number(usersCountRes[0].count) : 0;

    const inserted = await dbManager.query('SELECT * FROM public.broadcasts WHERE id = ?', [broadcastId]);

    return res.status(201).json({
      success: true,
      message: `Pesan broadcast berhasil dikirimkan ke seluruh member pengguna (${recipientCount} akun)!`,
      recipientCount,
      broadcast: formatBroadcast(inserted[0], false)
    });
  } catch (error) {
    console.error('Error sendBroadcast:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim pesan broadcast.',
      error: error.message
    });
  }
};

// 3. Tandai satu notifikasi sudah dibaca oleh user
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || (req.user ? req.user.id : null);

    if (!userId) {
      return res.json({ success: true, message: 'Status tersimpan lokal' });
    }

    const rowId = `un-${userId}-${id}`;
    await dbManager.query(
      `INSERT INTO public.user_notifications (id, user_id, broadcast_id, is_read, read_at, created_at)
       VALUES (?, ?, ?, TRUE, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET is_read = TRUE, read_at = NOW()`,
      [rowId, userId, id]
    );

    return res.json({
      success: true,
      message: 'Notifikasi ditandai telah dibaca.'
    });
  } catch (error) {
    console.error('Error markAsRead:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status notifikasi.'
    });
  }
};

// 4. Tandai semua notifikasi sudah dibaca oleh user
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.body.userId || (req.user ? req.user.id : null);

    if (!userId) {
      return res.json({ success: true, message: 'Status dibaca tersimpan' });
    }

    const allBroadcasts = await dbManager.query('SELECT id FROM public.broadcasts');
    for (const b of allBroadcasts) {
      const rowId = `un-${userId}-${b.id}`;
      await dbManager.query(
        `INSERT INTO public.user_notifications (id, user_id, broadcast_id, is_read, read_at, created_at)
         VALUES (?, ?, ?, TRUE, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET is_read = TRUE, read_at = NOW()`,
        [rowId, userId, b.id]
      );
    }

    return res.json({
      success: true,
      message: 'Semua notifikasi ditandai telah dibaca.'
    });
  } catch (error) {
    console.error('Error markAllAsRead:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menandai seluruh notifikasi.'
    });
  }
};

// 5. Admin menghapus pesan broadcast
exports.deleteBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    await dbManager.query('DELETE FROM public.broadcasts WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Pesan broadcast berhasil dihapus.'
    });
  } catch (error) {
    console.error('Error deleteBroadcast:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus pesan broadcast.'
    });
  }
};
