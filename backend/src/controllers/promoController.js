const promoModel = require('../models/promoModel');

function getUserId(req) {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  return req.headers['x-session-id'] || 'guest-default';
}

exports.getPromos = async (req, res) => {
  try {
    const userId = getUserId(req);
    const promos = await promoModel.findActive(userId);
    return res.json({
      success: true,
      count: promos.length,
      maxClaimPerUser: 3,
      data: promos
    });
  } catch (error) {
    console.error('Error getPromos:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data promo dari database.'
    });
  }
};

exports.getAllPromos = async (req, res) => {
  try {
    const promos = await promoModel.findAll();
    return res.json({
      success: true,
      count: promos.length,
      data: promos
    });
  } catch (error) {
    console.error('Error getAllPromos:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil seluruh data promo.'
    });
  }
};

// KLAIM VOUCHER (Maksimal 3 kali per pengguna sesuai sistem Shopee)
exports.claimPromo = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Kode voucher wajib disertakan.'
      });
    }

    const result = await promoModel.claimPromo(userId, code);
    return res.json({
      success: true,
      message: result.message,
      data: {
        code: result.promo.code,
        claimCount: result.userVoucher.claimCount,
        maxClaimPerUser: result.userVoucher.maxClaimPerUser,
        availableCount: result.userVoucher.availableCount,
        remainingQuota: Math.max(0, result.promo.quota - result.promo.usedCount)
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Gagal mengklaim voucher.'
    });
  }
};

// AMBIL DAFTAR VOUCHER SAYA (Milik pengguna aktif)
exports.getMyVouchers = async (req, res) => {
  try {
    const userId = getUserId(req);
    const userClaims = await promoModel.getUserClaims(userId);

    const activePromos = await promoModel.findActive(userId);
    const promoMap = new Map();
    activePromos.forEach(p => promoMap.set(p.code.toUpperCase(), p));

    const myVouchers = [];
    for (const c of userClaims) {
      const p = promoMap.get(c.promo_code.toUpperCase());
      const available = Math.max(0, Number(c.claim_count || 0) - Number(c.used_count || 0));
      if (p && available > 0) {
        myVouchers.push({
          ...p,
          claimCount: Number(c.claim_count),
          usedCount: Number(c.used_count),
          availableCount: available,
          maxClaimPerUser: 3
        });
      }
    }

    return res.json({
      success: true,
      count: myVouchers.length,
      data: myVouchers
    });
  } catch (error) {
    console.error('Error getMyVouchers:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar voucher saya.'
    });
  }
};

exports.validatePromo = async (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;
    const userId = getUserId(req);

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Masukkan kode promo terlebih dahulu!'
      });
    }

    const promo = await promoModel.findByCode(code);
    if (!promo || !promo.isActive) {
      return res.status(404).json({
        success: false,
        message: `Kode promo "${code.trim().toUpperCase()}" tidak ditemukan atau sudah tidak aktif.`
      });
    }

    // Cek klaim pengguna (apakah user sudah klaim dan masih punya sisa voucher)
    const userVoucher = await promoModel.getUserVoucher(userId, promo.code);
    if (userVoucher && userVoucher.availableCount <= 0) {
      return res.status(400).json({
        success: false,
        message: `Kamu sudah menggunakan seluruh voucher "${promo.code}" yang kamu klaim (${userVoucher.usedCount}/${userVoucher.claimCount}).`
      });
    }

    // Cek kuota global
    if (promo.quota > 0 && promo.usedCount >= promo.quota) {
      return res.status(400).json({
        success: false,
        message: `Maaf, kuota promo "${promo.code}" sudah habis.`
      });
    }

    const currentSubtotal = Number(subtotal) || 0;

    // Cek minimum belanja
    if (promo.minSpend > 0 && currentSubtotal < promo.minSpend) {
      const diff = promo.minSpend - currentSubtotal;
      return res.status(400).json({
        success: false,
        message: `Belum memenuhi syarat minimum belanja Rp${promo.minSpend.toLocaleString('id-ID')}. Tambahkan belanjaan Rp${diff.toLocaleString('id-ID')} lagi.`
      });
    }

    // Hitung nominal diskon
    let discountAmount = 0;
    if (promo.discountType === 'percent') {
      discountAmount = Math.round(currentSubtotal * (promo.discountValue / 100));
      if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
        discountAmount = promo.maxDiscount;
      }
    } else {
      discountAmount = Math.min(currentSubtotal, promo.discountValue);
    }

    const finalAmount = Math.max(0, currentSubtotal - discountAmount);

    return res.json({
      success: true,
      message: `Kode promo "${promo.code}" berhasil diterapkan! Hemat Rp${discountAmount.toLocaleString('id-ID')}`,
      data: {
        code: promo.code,
        title: promo.title,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount,
        subtotal: currentSubtotal,
        finalAmount,
        userAvailableCount: userVoucher ? userVoucher.availableCount : 1
      }
    });
  } catch (error) {
    console.error('Error validatePromo:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memvalidasi kode promo.'
    });
  }
};

exports.createPromo = async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discount_type = 'percent',
      discount_value,
      min_spend = 0,
      max_discount = null,
      quota = 100,
      category = 'diskon'
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Kode promo wajib diisi!'
      });
    }

    if (!discount_value || isNaN(Number(discount_value)) || Number(discount_value) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nilai diskon harus berupa angka valid di atas 0!'
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await promoModel.findByCode(cleanCode);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Kode promo "${cleanCode}" sudah ada!`
      });
    }

    const newPromo = await promoModel.create({
      code: cleanCode,
      title: title || cleanCode,
      description: description || '',
      discount_type,
      discount_value: Number(discount_value),
      min_spend: Number(min_spend) || 0,
      max_discount: max_discount ? Number(max_discount) : null,
      quota: Number(quota) || 100,
      category
    });

    return res.status(201).json({
      success: true,
      message: `Kode promo "${newPromo.code}" berhasil dibuat dengan kuota ${newPromo.quota}! Setiap user dapat mengklaim maks. 3 voucher.`,
      data: newPromo
    });
  } catch (error) {
    console.error('Error createPromo:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat kode promo.'
    });
  }
};

exports.updatePromo = async (req, res) => {
  try {
    const { code } = req.params;
    const existing = await promoModel.findByCode(code);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Kode promo tidak ditemukan.'
      });
    }

    const updated = await promoModel.update(code, req.body);
    return res.json({
      success: true,
      message: `Kode promo "${code.toUpperCase()}" berhasil diperbarui!`,
      data: updated
    });
  } catch (error) {
    console.error('Error updatePromo:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui kode promo.'
    });
  }
};

exports.togglePromoStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const { isActive } = req.body;
    const existing = await promoModel.findByCode(code);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Kode promo tidak ditemukan.'
      });
    }

    const updated = await promoModel.toggleActive(code, Boolean(isActive));
    return res.json({
      success: true,
      message: `Status promo "${code.toUpperCase()}" diubah menjadi ${updated.isActive ? 'Aktif' : 'Nonaktif'}.`,
      data: updated
    });
  } catch (error) {
    console.error('Error togglePromoStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status promo.'
    });
  }
};

exports.deletePromo = async (req, res) => {
  try {
    const { code } = req.params;
    const existing = await promoModel.findByCode(code);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Kode promo tidak ditemukan.'
      });
    }

    await promoModel.delete(code);
    return res.json({
      success: true,
      message: `Kode promo "${code.toUpperCase()}" berhasil dihapus.`
    });
  } catch (error) {
    console.error('Error deletePromo:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus kode promo.'
    });
  }
};
