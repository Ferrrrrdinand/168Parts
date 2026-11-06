const dbManager = require('../config/database');
const { Promo } = require('./index');

class PromoModel {
  async findAll() {
    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      const { data, error } = await dbManager.supabaseClient.from('promos').select('*').order('created_at', { ascending: false });
      if (!error && data) return data.map(this.formatRow);
    }
    const sql = 'SELECT * FROM promos ORDER BY created_at DESC';
    const rows = await dbManager.query(sql);
    return rows.map(this.formatRow);
  }

  async findActive() {
    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      const { data, error } = await dbManager.supabaseClient.from('promos').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (!error && data) return data.map(this.formatRow);
    }
    const sql = 'SELECT * FROM promos WHERE is_active = 1 ORDER BY created_at DESC';
    const rows = await dbManager.query(sql);
    return rows.map(this.formatRow);
  }

  async findByCode(code) {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();
    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      const { data, error } = await dbManager.supabaseClient.from('promos').select('*').ilike('code', cleanCode).maybeSingle();
      if (!error && data) return this.formatRow(data);
      return null;
    }
    const sql = 'SELECT * FROM promos WHERE UPPER(code) = ? LIMIT 1';
    const rows = await dbManager.query(sql, [cleanCode]);
    return rows.length > 0 ? this.formatRow(rows[0]) : null;
  }

  async create(data) {
    const cleanCode = (data.code || '').trim().toUpperCase();

    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      const payload = {
        code: cleanCode,
        title: (data.title || cleanCode).trim(),
        description: (data.description || '').trim(),
        discount_type: data.discount_type || 'percent',
        discount_value: Number(data.discount_value) || 0,
        min_spend: Number(data.min_spend) || 0,
        max_discount: data.max_discount ? Number(data.max_discount) : null,
        quota: Number(data.quota) || 100,
        used_count: 0,
        category: data.category || 'diskon',
        is_active: true
      };
      await dbManager.supabaseClient.from('promos').insert([payload]);
      return await this.findByCode(cleanCode);
    }

    const sql = `
      INSERT INTO promos (
        code, title, description, discount_type, discount_value,
        min_spend, max_discount, quota, used_count, category, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)
    `;

    await dbManager.query(sql, [
      cleanCode,
      data.title || cleanCode,
      data.description || '',
      data.discount_type || 'percent',
      Number(data.discount_value) || 0,
      Number(data.min_spend) || 0,
      data.max_discount ? Number(data.max_discount) : null,
      Number(data.quota) || 100,
      data.category || 'diskon'
    ]);

    return await this.findByCode(cleanCode);
  }

  async delete(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      await dbManager.supabaseClient.from('promos').delete().ilike('code', cleanCode);
      return true;
    }
    const sql = 'DELETE FROM promos WHERE UPPER(code) = ?';
    await dbManager.query(sql, [cleanCode]);
    return true;
  }

  async toggleActive(code, isActive) {
    const cleanCode = (code || '').trim().toUpperCase();
    const val = isActive ? 1 : 0;
    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      await dbManager.supabaseClient.from('promos').update({ is_active: Boolean(isActive) }).ilike('code', cleanCode);
      return await this.findByCode(cleanCode);
    }
    const sql = 'UPDATE promos SET is_active = ? WHERE UPPER(code) = ?';
    await dbManager.query(sql, [val, cleanCode]);
    return await this.findByCode(cleanCode);
  }

  async update(code, data) {
    const cleanCode = (code || '').trim().toUpperCase();
    const existing = await this.findByCode(cleanCode);
    if (!existing) return null;

    if (dbManager.isConnected && dbManager.supabaseClient && !dbManager.pgPool) {
      const payload = {
        title: data.title !== undefined ? data.title : existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        discount_type: data.discount_type !== undefined ? data.discount_type : existing.discountType,
        discount_value: data.discount_value !== undefined ? Number(data.discount_value) : existing.discountValue,
        min_spend: data.min_spend !== undefined ? Number(data.min_spend) : existing.minSpend,
        max_discount: data.max_discount !== undefined ? (data.max_discount ? Number(data.max_discount) : null) : existing.maxDiscount,
        quota: data.quota !== undefined ? Number(data.quota) : existing.quota,
        category: data.category !== undefined ? data.category : existing.category,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : existing.isActive
      };
      await dbManager.supabaseClient.from('promos').update(payload).ilike('code', cleanCode);
      return await this.findByCode(cleanCode);
    }

    const sql = `
      UPDATE promos SET
        title = ?,
        description = ?,
        discount_type = ?,
        discount_value = ?,
        min_spend = ?,
        max_discount = ?,
        quota = ?,
        category = ?,
        is_active = ?
      WHERE UPPER(code) = ?
    `;

    await dbManager.query(sql, [
      data.title !== undefined ? data.title : existing.title,
      data.description !== undefined ? data.description : existing.description,
      data.discount_type !== undefined ? data.discount_type : existing.discountType,
      data.discount_value !== undefined ? Number(data.discount_value) : existing.discountValue,
      data.min_spend !== undefined ? Number(data.min_spend) : existing.minSpend,
      data.max_discount !== undefined ? (data.max_discount ? Number(data.max_discount) : null) : existing.maxDiscount,
      data.quota !== undefined ? Number(data.quota) : existing.quota,
      data.category !== undefined ? data.category : existing.category,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : (existing.isActive ? 1 : 0),
      cleanCode
    ]);

    return await this.findByCode(cleanCode);
  }

  async incrementUsage(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    const sql = 'UPDATE promos SET used_count = used_count + 1 WHERE UPPER(code) = ?';
    await dbManager.query(sql, [cleanCode]);
  }

  formatRow(row) {
    if (!row) return null;
    return {
      code: row.code,
      title: row.title,
      description: row.description,
      discountType: row.discount_type,
      discountValue: Number(row.discount_value),
      minSpend: Number(row.min_spend || 0),
      maxDiscount: row.max_discount ? Number(row.max_discount) : null,
      quota: Number(row.quota || 0),
      usedCount: Number(row.used_count || 0),
      category: row.category || 'diskon',
      isActive: Boolean(row.is_active)
    };
  }
}

module.exports = new PromoModel();

