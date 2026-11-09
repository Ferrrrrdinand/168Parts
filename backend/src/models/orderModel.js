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
      status: row.status || 'Sedang Diproses',
      subtotal: Number(row.subtotal || row.total_amount || 0),
      promoCode: row.promo_code || null,
      discountAmount: Number(row.discount_amount || 0),
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
    const status = data.status || 'Sedang Diproses';
    const subtotal = Number(data.subtotal || totalAmount);
    const promoCode = data.promoCode || null;
    const discountAmount = Number(data.discountAmount || 0);

    const sql = `
      INSERT INTO orders (
        id, user_id, items, shipping_address, payment_method, notes,
        total_amount, earned_points, status, subtotal, promo_code, discount_amount,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await dbManager.query(sql, [
      id, userId, itemsJson, shippingAddress, paymentMethod, notes,
      totalAmount, earnedPoints, status, subtotal, promoCode, discountAmount
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
    await dbManager.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return await this.findById(id);
  }
}

module.exports = new OrderModel();
