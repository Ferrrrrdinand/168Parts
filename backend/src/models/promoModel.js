const dbManager = require('../config/database');

const MAX_CLAIM_PER_USER = 3;

class PromoModel {
  async findAll() {
    const sql = 'SELECT * FROM promos ORDER BY created_at DESC';
    const rows = await dbManager.query(sql);
    return (rows || []).map(r => this.formatRow(r));
  }

  async findActive(userId = null) {
    const sql = 'SELECT * FROM promos WHERE is_active = true ORDER BY created_at DESC';
    const rows = await dbManager.query(sql);
    const activePromos = (rows || []).map(r => this.formatRow(r));

    if (!userId) {
      return activePromos.map(p => ({
        ...p,
        userClaimCount: 0,
        userAvailableCount: 0,
        maxClaimPerUser: MAX_CLAIM_PER_USER,
        remainingQuota: Math.max(0, p.quota - p.usedCount),
        isSoldOut: p.quota > 0 && p.usedCount >= p.quota,
        isMaxClaimed: false,
        canClaim: p.quota === 0 || p.usedCount < p.quota
      }));
    }

    const userClaims = await this.getUserClaims(userId);
    const claimMap = new Map();
    userClaims.forEach(c => claimMap.set(c.promo_code.toUpperCase(), c));

    return activePromos.map(p => {
      const claim = claimMap.get(p.code.toUpperCase());
      const claimCount = claim ? Number(claim.claim_count || 0) : 0;
      const usedCount = claim ? Number(claim.used_count || 0) : 0;
      const available = Math.max(0, claimCount - usedCount);
      const isSoldOut = p.quota > 0 && p.usedCount >= p.quota;
      const isMaxClaimed = claimCount >= MAX_CLAIM_PER_USER;

      return {
        ...p,
        userClaimCount: claimCount,
        userAvailableCount: available,
        maxClaimPerUser: MAX_CLAIM_PER_USER,
        remainingQuota: Math.max(0, p.quota - p.usedCount),
        isSoldOut,
        isMaxClaimed,
        canClaim: !isSoldOut && !isMaxClaimed
      };
    });
  }

  async findByCode(code) {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();
    const sql = 'SELECT * FROM promos WHERE UPPER(code) = ? LIMIT 1';
    const rows = await dbManager.query(sql, [cleanCode]);
    return (rows && rows.length > 0) ? this.formatRow(rows[0]) : null;
  }

  // Ambil semua voucher yang sudah diklaim oleh user tertentu
  async getUserClaims(userId) {
    if (!userId) return [];
    const sql = 'SELECT * FROM user_vouchers WHERE user_id = ?';
    const rows = await dbManager.query(sql, [userId]);
    return rows || [];
  }

  // Ambil data klaim 1 voucher untuk user tertentu
  async getUserVoucher(userId, code) {
    if (!userId || !code) return null;
    const cleanCode = code.trim().toUpperCase();
    const sql = 'SELECT * FROM user_vouchers WHERE user_id = ? AND UPPER(promo_code) = ? LIMIT 1';
    const rows = await dbManager.query(sql, [userId, cleanCode]);
    if (rows && rows.length > 0) {
      const r = rows[0];
      const claimCount = Number(r.claim_count || 0);
      const usedCount = Number(r.used_count || 0);
      return {
        id: r.id,
        userId: r.user_id,
        promoCode: r.promo_code,
        claimCount,
        usedCount,
        availableCount: Math.max(0, claimCount - usedCount),
        maxClaimPerUser: MAX_CLAIM_PER_USER,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    }
    return null;
  }

  // KLAIM VOUCHER (Maksimal 3 voucher per user seperti Shopee)
  async claimPromo(userId, code) {
    if (!userId) {
      throw new Error('Identitas pengguna tidak valid.');
    }
    const cleanCode = (code || '').trim().toUpperCase();
    const promo = await this.findByCode(cleanCode);

    if (!promo || !promo.isActive) {
      throw new Error(`Voucher "${cleanCode}" tidak ditemukan atau sudah tidak aktif.`);
    }

    // 1. Cek Kuota Global yang dibuat Admin (misal 500)
    if (promo.quota > 0 && promo.usedCount >= promo.quota) {
      throw new Error(`Maaf, kuota voucher "${cleanCode}" telah habis (total kuota: ${promo.quota}).`);
    }

    // 2. Cek Batas Maksimal Klaim per Pengguna (Maksimal 3 Voucher)
    const existingClaim = await this.getUserVoucher(userId, cleanCode);
    let newClaimCount = 1;

    if (existingClaim) {
      if (existingClaim.claimCount >= MAX_CLAIM_PER_USER) {
        throw new Error(`Kamu sudah mencapai batas maksimal ${MAX_CLAIM_PER_USER} voucher untuk promo "${cleanCode}".`);
      }
      newClaimCount = existingClaim.claimCount + 1;
      await dbManager.query(
        'UPDATE user_vouchers SET claim_count = ?, updated_at = NOW() WHERE id = ?',
        [newClaimCount, existingClaim.id]
      );
    } else {
      await dbManager.query(
        'INSERT INTO user_vouchers (user_id, promo_code, claim_count, used_count, created_at, updated_at) VALUES (?, ?, 1, 0, NOW(), NOW())',
        [userId, cleanCode]
      );
    }

    // 3. Potong kuota global di tabel promos (tambah used_count)
    await dbManager.query(
      'UPDATE promos SET used_count = used_count + 1 WHERE UPPER(code) = ?',
      [cleanCode]
    );

    const updatedVoucher = await this.getUserVoucher(userId, cleanCode);
    const updatedPromo = await this.findByCode(cleanCode);

    return {
      success: true,
      promo: updatedPromo,
      userVoucher: updatedVoucher,
      message: `Berhasil klaim voucher "${cleanCode}"! (Koleksi kamu: ${newClaimCount}/${MAX_CLAIM_PER_USER})`
    };
  }

  // Menggunakan 1 voucher saat checkout
  async useVoucher(userId, code) {
    if (!userId || !code) return false;
    const cleanCode = code.trim().toUpperCase();
    const claim = await this.getUserVoucher(userId, cleanCode);

    if (claim && claim.availableCount > 0) {
      await dbManager.query(
        'UPDATE user_vouchers SET used_count = used_count + 1, updated_at = NOW() WHERE id = ?',
        [claim.id]
      );
      return true;
    }
    return false;
  }

  async create(data) {
    const cleanCode = (data.code || '').trim().toUpperCase();
    const sql = `
      INSERT INTO promos (
        code, title, description, discount_type, discount_value,
        min_spend, max_discount, quota, used_count, category, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, true)
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
    const sql = 'DELETE FROM promos WHERE UPPER(code) = ?';
    await dbManager.query(sql, [cleanCode]);
    // Bersihkan juga relasi klaim user
    await dbManager.query('DELETE FROM user_vouchers WHERE UPPER(promo_code) = ?', [cleanCode]);
    return true;
  }

  async toggleActive(code, isActive) {
    const cleanCode = (code || '').trim().toUpperCase();
    const val = Boolean(isActive);
    const sql = 'UPDATE promos SET is_active = ? WHERE UPPER(code) = ?';
    await dbManager.query(sql, [val, cleanCode]);
    return await this.findByCode(cleanCode);
  }

  async update(code, data) {
    const cleanCode = (code || '').trim().toUpperCase();
    const existing = await this.findByCode(cleanCode);
    if (!existing) return null;

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
      data.is_active !== undefined ? Boolean(data.is_active) : existing.isActive,
      cleanCode
    ]);

    return await this.findByCode(cleanCode);
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
