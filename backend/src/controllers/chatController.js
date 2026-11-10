const dbManager = require('../config/database');

// Format room object
function formatRoom(r) {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    customerName: r.customer_name || 'Pelanggan 168',
    customerEmail: r.customer_email || null,
    customerPhone: r.customer_phone || null,
    lastMessage: r.last_message || '',
    lastMessageAt: r.last_message_at,
    status: r.status || 'ai_active', // 'ai_active', 'needs_admin', 'admin_handling', 'resolved'
    unreadAdmin: Number(r.unread_admin || 0),
    unreadUser: Number(r.unread_user || 0),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

// Format message object
function formatMessage(m) {
  if (!m) return null;
  let actions = [];
  if (m.actions) {
    try {
      actions = typeof m.actions === 'string' ? JSON.parse(m.actions) : m.actions;
    } catch (e) {
      actions = [];
    }
  }

  return {
    id: m.id,
    roomId: m.room_id,
    senderType: m.sender_type, // 'user', 'bot', 'admin'
    senderName: m.sender_name || (m.sender_type === 'admin' ? 'Admin 168 Parts' : (m.sender_type === 'bot' ? '168 Care AI' : 'Pelanggan')),
    message: m.message,
    actions: actions,
    isRead: Boolean(m.is_read),
    createdAt: m.created_at
  };
}

// 1. Inisialisasi atau buka room chat customer
exports.initRoom = async (req, res) => {
  try {
    const { roomId, userId, customerName, customerEmail, customerPhone } = req.body || {};
    const finalRoomId = roomId || (userId ? `room_${userId}` : `room_guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);

    // Cek apakah room sudah ada di database
    const existing = await dbManager.query('SELECT * FROM public.chat_rooms WHERE id = ?', [finalRoomId]);

    let roomRow = null;
    if (existing && existing.length > 0) {
      roomRow = existing[0];
      // Update data identitas jika ada pembaruan
      const newName = customerName || roomRow.customer_name;
      const newEmail = customerEmail || roomRow.customer_email;
      const newPhone = customerPhone || roomRow.customer_phone;
      const newUserId = userId || roomRow.user_id;

      await dbManager.query(
        `UPDATE public.chat_rooms 
         SET customer_name = ?, customer_email = ?, customer_phone = ?, user_id = ?, unread_user = 0, updated_at = NOW() 
         WHERE id = ?`,
        [newName, newEmail, newPhone, newUserId, finalRoomId]
      );

      const refreshed = await dbManager.query('SELECT * FROM public.chat_rooms WHERE id = ?', [finalRoomId]);
      roomRow = refreshed[0] || roomRow;
    } else {
      // Buat room baru
      await dbManager.query(
        `INSERT INTO public.chat_rooms (id, user_id, customer_name, customer_email, customer_phone, last_message, status, unread_admin, unread_user, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`,
        [
          finalRoomId,
          userId || null,
          customerName || 'Pelanggan 168',
          customerEmail || null,
          customerPhone || null,
          'Percakapan dimulai',
          'ai_active'
        ]
      );
      const inserted = await dbManager.query('SELECT * FROM public.chat_rooms WHERE id = ?', [finalRoomId]);
      roomRow = inserted[0];
    }

    // Ambil histori pesan dalam room
    const msgRows = await dbManager.query(
      'SELECT * FROM public.chat_messages WHERE room_id = ? ORDER BY created_at ASC LIMIT 150',
      [finalRoomId]
    );

    return res.json({
      success: true,
      room: formatRoom(roomRow),
      messages: (msgRows || []).map(formatMessage)
    });
  } catch (error) {
    console.error('Error initRoom:', error);
    return res.status(500).json({ success: false, message: 'Gagal inisialisasi ruang chat.', error: error.message });
  }
};

// 2. Daftar seluruh room chat (Untuk Admin Seller Centre)
exports.getRooms = async (req, res) => {
  try {
    const { status, q } = req.query || {};

    let querySql = 'SELECT * FROM public.chat_rooms WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      querySql += ` AND status = ?`;
    }

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      querySql += ` AND (customer_name ILIKE ? OR customer_email ILIKE ? OR customer_phone ILIKE ? OR last_message ILIKE ?)`;
      params.push(`%${q.trim()}%`, `%${q.trim()}%`, `%${q.trim()}%`);
    }

    querySql += ' ORDER BY updated_at DESC LIMIT 100';

    const rows = await dbManager.query(querySql, params);

    // Hitung counter summary
    const allRooms = await dbManager.query('SELECT status, unread_admin FROM public.chat_rooms');
    const summary = {
      total: allRooms.length,
      needsAdmin: allRooms.filter(r => r.status === 'needs_admin').length,
      handling: allRooms.filter(r => r.status === 'admin_handling').length,
      aiActive: allRooms.filter(r => r.status === 'ai_active').length,
      resolved: allRooms.filter(r => r.status === 'resolved').length,
      totalUnread: allRooms.reduce((acc, r) => acc + Number(r.unread_admin || 0), 0)
    };

    return res.json({
      success: true,
      rooms: (rows || []).map(formatRoom),
      summary
    });
  } catch (error) {
    console.error('Error getRooms:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar percakapan chat.', error: error.message });
  }
};

// 3. Ambil pesan dalam suatu room (Customer / Admin)
exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { asAdmin } = req.query;

    const roomRes = await dbManager.query('SELECT * FROM public.chat_rooms WHERE id = ?', [roomId]);
    if (!roomRes || roomRes.length === 0) {
      return res.status(404).json({ success: false, message: 'Ruang percakapan tidak ditemukan.' });
    }

    // Jika admin membuka chat, tandai unread_admin = 0 & is_read = true
    if (asAdmin === 'true') {
      await dbManager.query(
        'UPDATE public.chat_rooms SET unread_admin = 0 WHERE id = ?',
        [roomId]
      );
      await dbManager.query(
        "UPDATE public.chat_messages SET is_read = TRUE WHERE room_id = ? AND sender_type = 'user'",
        [roomId]
      );
    } else {
      // Customer membuka chat, reset unread_user = 0
      await dbManager.query(
        'UPDATE public.chat_rooms SET unread_user = 0 WHERE id = ?',
        [roomId]
      );
    }

    const messages = await dbManager.query(
      'SELECT * FROM public.chat_messages WHERE room_id = ? ORDER BY created_at ASC LIMIT 200',
      [roomId]
    );

    const refreshedRoom = await dbManager.query('SELECT * FROM public.chat_rooms WHERE id = ?', [roomId]);

    return res.json({
      success: true,
      room: formatRoom(refreshedRoom[0]),
      messages: (messages || []).map(formatMessage)
    });
  } catch (error) {
    console.error('Error getRoomMessages:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil histori pesan.', error: error.message });
  }
};

// 4. Kirim pesan ke room (Bisa dari User, AI Bot, atau Admin)
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, senderType = 'user', senderName, actions, status } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Teks pesan tidak boleh kosong.' });
    }

    // Pastikan room ada
    const roomCheck = await dbManager.query('SELECT * FROM public.chat_rooms WHERE id = ?', [roomId]);
    if (!roomCheck || roomCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Ruang chat tidak ditemukan.' });
    }

    const currentRoom = roomCheck[0];
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const actionsJson = actions ? JSON.stringify(actions) : '[]';

    // Tentukan perubahan status & unread
    let newStatus = currentRoom.status;
    let unreadAdminIncrement = 0;
    let unreadUserIncrement = 0;

    if (senderType === 'user') {
      unreadAdminIncrement = 1;
      // Jika user meminta admin atau status sudah needs_admin
      if (status === 'needs_admin' || currentRoom.status === 'needs_admin') {
        newStatus = 'needs_admin';
      } else if (currentRoom.status === 'resolved') {
        newStatus = 'needs_admin'; // Reopen percakapan yang selesai
      }
    } else if (senderType === 'admin') {
      unreadUserIncrement = 1;
      newStatus = 'admin_handling'; // Admin aktif mengambil alih percakapan
    } else if (senderType === 'bot') {
      if (status === 'needs_admin') {
        newStatus = 'needs_admin';
      }
    }

    // 1. Simpan pesan baru
    await dbManager.query(
      `INSERT INTO public.chat_messages (id, room_id, sender_type, sender_name, message, actions, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [
        msgId,
        roomId,
        senderType,
        senderName || (senderType === 'admin' ? 'Admin 168 Parts' : (senderType === 'bot' ? '168 Care AI' : currentRoom.customer_name)),
        text.trim(),
        actionsJson
      ]
    );

    // 2. Update status room, last_message, dan counter unread
    let updateSql = `
      UPDATE public.chat_rooms 
      SET last_message = ?, 
          last_message_at = NOW(), 
          status = ?, 
          updated_at = NOW()
    `;
    const updateParams = [text.trim(), newStatus];

    if (senderType === 'user') {
      updateSql += `, unread_admin = unread_admin + 1`;
    } else if (senderType === 'admin') {
      updateSql += `, unread_user = unread_user + 1, unread_admin = 0`;
    }

    updateSql += ` WHERE id = ?`;
    updateParams.push(roomId);

    await dbManager.query(updateSql, updateParams);

    // Ambil data terbaru
    const updatedRoom = await dbManager.query('SELECT * FROM public.chat_rooms WHERE id = ?', [roomId]);
    const insertedMsg = await dbManager.query('SELECT * FROM public.chat_messages WHERE id = ?', [msgId]);

    return res.json({
      success: true,
      message: formatMessage(insertedMsg[0]),
      room: formatRoom(updatedRoom[0])
    });
  } catch (error) {
    console.error('Error sendMessage:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengirim pesan chat.', error: error.message });
  }
};

// 5. Update Status Room (Admin can mark 'resolved', 'admin_handling', or 'ai_active')
exports.updateRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body || {};

    const validStatuses = ['ai_active', 'needs_admin', 'admin_handling', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status ruang chat tidak valid.' });
    }

    let sql = 'UPDATE public.chat_rooms SET status = ?, updated_at = NOW()';
    const params = [status];

    if (status === 'resolved') {
      sql += ', unread_admin = 0';
    }

    sql += ' WHERE id = ?';
    params.push(roomId);

    await dbManager.query(sql, params);

    const updated = await dbManager.query('SELECT * FROM public.chat_rooms WHERE id = ?', [roomId]);
    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Ruang chat tidak ditemukan.' });
    }

    return res.json({
      success: true,
      room: formatRoom(updated[0])
    });
  } catch (error) {
    console.error('Error updateRoomStatus:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status ruang chat.', error: error.message });
  }
};

