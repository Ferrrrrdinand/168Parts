const promoModel = require('../models/promoModel');

exports.getPromos = async (req, res) => {
  try {
    const promos = await promoModel.findActive();
    return res.json({
      success: true,
      count: promos.length,
      data: promos
    });
  } catch (error) {
    console.error('Error getPromos:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data promo.'
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

exports.validatePromo = async (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;

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

    // Cek kuota
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
      // fixed nominal
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
        finalAmount
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
      discount_type,
      discount_value,
      min_spend,
      max_discount,
      quota,
      category
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Kode promo wajib diisi!'
      });
    }

    if (!discount_value || Number(discount_value) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nilai diskon harus lebih besar dari 0!'
      });
    }

    const existing = await promoModel.findByCode(code);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Kode promo "${code.trim().toUpperCase()}" sudah ada!`
      });
    }

    const newPromo = await promoModel.create({
      code: code.trim().toUpperCase(),
      title: (title || code).trim(),
      description: (description || '').trim(),
      discount_type: discount_type === 'fixed' ? 'fixed' : 'percent',
      discount_value: Number(discount_value),
      min_spend: Number(min_spend || 0),
      max_discount: max_discount ? Number(max_discount) : null,
      quota: Number(quota || 100),
      category: category || 'diskon'
    });

    return res.status(201).json({
      success: true,
      message: `Kode promo "${newPromo.code}" berhasil dibuat dan siap digunakan!`,
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

