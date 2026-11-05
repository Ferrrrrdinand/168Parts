const storage = require('../models/storage');

const defaultBanners = {
  left: {
    badge: '✨ PASARIN PILIH LOKAL',
    title: 'Kreasi Unggulan & Inovasi Nusantara',
    subtitle: 'Karya Terbaik Anak Bangsa',
    pills: [
      '🏷️ Produk Unik Asli Indonesia',
      '⚡ Inovasi Lokal Rasa Global',
      '⭐ Kualitas Unggulan Nusantara'
    ],
    modelImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&auto=format&fit=crop&q=80',
    bgGradient: 'linear-gradient(135deg, #1d3f0d 0%, #285715 100%)',
    targetUrl: '#/search?category=Pilih+Lokal'
  },
  right: {
    title: 'Spesial Diskon & Voucher',
    modelImage1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
    modelImage2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
    pill1Title: 'DISKON S.D.',
    pill1Val: '80%',
    pill2Title: 'VOUCHER',
    pill2Val: '100RB',
    bgGradient: 'linear-gradient(135deg, #3b0764 0%, #581c87 50%, #4c1d95 100%)',
    targetUrl: '#/search?q=promo'
  }
};

exports.getBanners = (req, res) => {
  try {
    const db = storage.read();
    if (!db.banners || !db.banners.left) {
      db.banners = defaultBanners;
      storage.write(db);
    }
    return res.json({
      success: true,
      data: db.banners
    });
  } catch (error) {
    console.error('Error getBanners:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data banner.'
    });
  }
};

exports.updateBanners = (req, res) => {
  try {
    const db = storage.read();
    const current = db.banners || defaultBanners;

    const updated = {
      left: {
        ...(current.left || defaultBanners.left),
        ...(req.body.left || {})
      },
      right: {
        ...(current.right || defaultBanners.right),
        ...(req.body.right || {})
      }
    };

    db.banners = updated;
    storage.write(db);

    return res.json({
      success: true,
      message: 'Banner berhasil diperbarui!',
      data: updated
    });
  } catch (error) {
    console.error('Error updateBanners:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data banner.'
    });
  }
};

exports.resetBanners = (req, res) => {
  try {
    const db = storage.read();
    db.banners = defaultBanners;
    storage.write(db);
    return res.json({
      success: true,
      message: 'Banner berhasil dikembalikan ke pengaturan default!',
      data: defaultBanners
    });
  } catch (error) {
    console.error('Error resetBanners:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mereset banner.'
    });
  }
};

