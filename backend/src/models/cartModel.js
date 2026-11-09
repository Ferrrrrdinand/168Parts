const dbManager = require('../config/database');
const productModel = require('./productModel');

class CartModel {
  async getCart(ownerKey) {
    if (!ownerKey) return [];
    const rows = await dbManager.query(
      'SELECT product_id, quantity, added_at FROM carts WHERE owner_key = ? ORDER BY added_at ASC',
      [ownerKey]
    );

    const enriched = [];
    for (const r of rows) {
      const p = await productModel.findById(r.product_id);
      if (p) {
        enriched.push({
          productId: p.id,
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          discountPercent: p.discountPercent,
          icon: p.icon,
          image: p.image,
          bgPattern: p.bgPattern,
          shopName: p.shopName,
          stock: p.stock,
          quantity: Number(r.quantity),
          itemTotal: p.price * Number(r.quantity)
        });
      }
    }
    return enriched;
  }

  async addItem(ownerKey, productId, quantity = 1) {
    const existing = await dbManager.query(
      'SELECT id, quantity FROM carts WHERE owner_key = ? AND product_id = ? LIMIT 1',
      [ownerKey, productId]
    );

    if (existing && existing.length > 0) {
      const newQty = Number(existing[0].quantity) + Number(quantity);
      await dbManager.query(
        'UPDATE carts SET quantity = ?, added_at = NOW() WHERE id = ?',
        [newQty, existing[0].id]
      );
    } else {
      await dbManager.query(
        'INSERT INTO carts (owner_key, product_id, quantity, added_at) VALUES (?, ?, ?, NOW())',
        [ownerKey, productId, Number(quantity)]
      );
    }
    return await this.getCart(ownerKey);
  }

  async updateQuantity(ownerKey, productId, quantity) {
    const qty = parseInt(quantity, 10);
    if (qty <= 0) {
      return await this.removeItem(ownerKey, productId);
    }
    await dbManager.query(
      'UPDATE carts SET quantity = ?, added_at = NOW() WHERE owner_key = ? AND product_id = ?',
      [qty, ownerKey, productId]
    );
    return await this.getCart(ownerKey);
  }

  async removeItem(ownerKey, productId) {
    await dbManager.query(
      'DELETE FROM carts WHERE owner_key = ? AND product_id = ?',
      [ownerKey, productId]
    );
    return await this.getCart(ownerKey);
  }

  async clearCart(ownerKey) {
    await dbManager.query('DELETE FROM carts WHERE owner_key = ?', [ownerKey]);
    return [];
  }
}

module.exports = new CartModel();
