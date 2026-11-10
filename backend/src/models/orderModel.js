const dbManager = require('../config/database');

class OrderModel {
  formatOrder(row) {
    if (!row) return null;
    let items = [];
    if (row.items) {
      try {
        items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
      } catch (e) {
        items = [];
      }
    }
    return {
      id: row.id,
      userId: row.user_id,
      items: items,
      shippingAddress: row.shipping_address,
      paymentMethod: row.payment_method,
      notes: row.notes || '',
      totalAmount: Number(row.total_amount || 0),
      earnedPoints: Number(row.earned_points || 0),
      redeemedPoints: Number(row.redeemed_points || 0),
      status: row.status || 'Sedang Diproses',
      subtotal: Number(row.subtotal || row.total_amount || 0),
      promoCode: row.promo_code || null,
      discountAmount: Number(row.discount_amount || 0),
      arrivedAt: row.arrived_at || null,
      returnStatus: row.return_status || 'none',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async create(data) {
    const id = data.id || ('ORD-' + Date.now().toString(36).toUpperCase());
    const userId = data.userId || 'guest';
    const itemsJson = typeof data.items === 'string' ? data.items : JSON.stringify(data.items || []);
    const shippingAddress = data.shippingAddress || '';
    const paymentMethod = data.paymentMethod || 'Transfer Bank';
    const notes = data.notes || '';
    const totalAmount = Number(data.totalAmount || 0);
    const earnedPoints = Number(data.earnedPoints || Math.floor(totalAmount / 1000));
    const redeemedPoints = Number(data.redeemedPoints || 0);
    const status = data.status || 'Sedang Diproses';
    const subtotal = Number(data.subtotal || totalAmount);
    const promoCode = data.promoCode || null;
    const discountAmount = Number(data.discountAmount || 0);

    const sql = `
      INSERT INTO orders (
        id, user_id, items, shipping_address, payment_method, notes,
        total_amount, earned_points, redeemed_points, status, subtotal, promo_code, discount_amount,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await dbManager.query(sql, [
      id, userId, itemsJson, shippingAddress, paymentMethod, notes,
      totalAmount, earnedPoints, redeemedPoints, status, subtotal, promoCode, discountAmount
    ]);

    return await this.findById(id);
  }

  async findById(id) {
    if (!id) return null;
    const rows = await dbManager.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
    if (rows && rows.length > 0) {
      return this.formatOrder(rows[0]);
    }
    return null;
  }

  async findByUserId(userId) {
    if (!userId) return [];
    const rows = await dbManager.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return (rows || []).map(r => this.formatOrder(r));
  }

  async findAll() {
    const rows = await dbManager.query('SELECT * FROM orders ORDER BY created_at DESC');
    return (rows || []).map(r => this.formatOrder(r));
  }

  async updateStatus(id, status) {
    const isArrived = status === 'Sampai di Tujuan' || status === 'Selesai';
    if (isArrived) {
      await dbManager.query(
        'UPDATE orders SET status = ?, arrived_at = COALESCE(arrived_at, NOW()), updated_at = NOW() WHERE id = ?',
        [status, id]
      );
    } else {
      await dbManager.query(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
    }
    return await this.findById(id);
  }

  /* ---------------- PENGEMBALIAN BARANG (RETURNS) ---------------- */
  async createReturn({ orderId, userId, userName, reason, videoData, photosData }) {
    const returnId = 'RET-' + Date.now().toString(36).toUpperCase();
    const videoJson = typeof videoData === 'string' ? videoData : JSON.stringify(videoData || {});
    const photosJson = typeof photosData === 'string' ? photosData : JSON.stringify(photosData || []);

    const sql = `
      INSERT INTO order_returns (
        id, order_id, user_id, user_name, reason, video_data, photos_data, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Menunggu Review Admin', NOW(), NOW())
    `;

    await dbManager.query(sql, [
      returnId, orderId, userId, userName || 'Pelanggan', reason, videoJson, photosJson
    ]);

    await dbManager.query(
      "UPDATE orders SET return_status = 'pending', updated_at = NOW() WHERE id = ?",
      [orderId]
    );

    return await this.findReturnById(returnId);
  }

  async findReturnById(id) {
    if (!id) return null;
    const rows = await dbManager.query('SELECT * FROM order_returns WHERE id = ? LIMIT 1', [id]);
    return (rows && rows.length > 0) ? this.formatReturn(rows[0]) : null;
  }

  async findReturnByOrderId(orderId) {
    if (!orderId) return null;
    const rows = await dbManager.query(
      'SELECT * FROM order_returns WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );
    return (rows && rows.length > 0) ? this.formatReturn(rows[0]) : null;
  }

  async findAllReturns() {
    const rows = await dbManager.query(`
      SELECT r.*, o.total_amount, o.items, o.shipping_address, o.created_at as order_date, o.arrived_at
      FROM order_returns r
      LEFT JOIN orders o ON r.order_id = o.id
      ORDER BY r.created_at DESC
    `);
    return (rows || []).map(r => this.formatReturn(r));
  }

  async updateReturnReview(returnId, status, adminNotes = '') {
    await dbManager.query(
      'UPDATE order_returns SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
      [status, adminNotes || '', returnId]
    );

    const ret = await this.findReturnById(returnId);
    if (ret && ret.orderId) {
      const orderRetStatus = status === 'Disetujui' ? 'approved' : (status === 'Ditolak' ? 'rejected' : 'pending');
      await dbManager.query(
        'UPDATE orders SET return_status = ?, updated_at = NOW() WHERE id = ?',
        [orderRetStatus, ret.orderId]
      );
    }
    return ret;
  }

  formatReturn(row) {
    if (!row) return null;
    let video = {};
    let photos = [];
    let items = [];
    try {
      video = typeof row.video_data === 'string' ? JSON.parse(row.video_data) : (row.video_data || {});
    } catch (e) {
      video = { raw: row.video_data };
    }
    try {
      photos = typeof row.photos_data === 'string' ? JSON.parse(row.photos_data) : (row.photos_data || []);
    } catch (e) {
      photos = [];
    }
    if (row.items) {
      try {
        items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
      } catch (e) {
        items = [];
      }
    }
    return {
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      userName: row.user_name || 'Pelanggan',
      reason: row.reason,
      video,
      photos,
      status: row.status || 'Menunggu Review Admin',
      adminNotes: row.admin_notes || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Metadata tambahan dari JOIN orders jika ada
      totalAmount: row.total_amount ? Number(row.total_amount) : undefined,
      items: items.length > 0 ? items : undefined,
      orderDate: row.order_date || undefined,
      arrivedAt: row.arrived_at || undefined
    };
  }
}

module.exports = new OrderModel();

