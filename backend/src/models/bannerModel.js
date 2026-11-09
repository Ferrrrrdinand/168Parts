const dbManager = require('../config/database');

const defaultBanners = {
  left: {
    badge: '✨ 168 PARTS SURABAYA',
    title: 'Pusat Sparepart & Alat Servis HP Terlengkap',
    subtitle: 'Kualitas Original Garansi Toko Terpercaya',
    pills: [
      '🏷️ LCD & Baterai Bergaransi',
      '⚡ Promo Pengguna Baru: Diskon 50RB',
      '⭐ Sparepart Presisi Siap Kirim'
    ],
    modelImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=320&auto=format&fit=crop&q=80',
    bgGradient: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
    targetUrl: 'login.html?promo=newuser#register'
  },
  right: {
    title: 'Flash Sale & Promo Spesial Teknisi',
    modelImage1: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=240&auto=format&fit=crop&q=80',
    modelImage2: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=240&auto=format&fit=crop&q=80',
    pill1Title: 'DISKON S.D.',
    pill1Val: '50%',
    pill2Title: 'VOUCHER',
    pill2Val: '100RB',
    bgGradient: 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #be123c 100%)',
    targetUrl: '#promo'
  }
};

class BannerModel {
  async getBanner() {
    const rows = await dbManager.query("SELECT config_json FROM banners WHERE id = 'main_banner' LIMIT 1");
    if (rows && rows.length > 0 && rows[0].config_json) {
      const cfg = rows[0].config_json;
      return typeof cfg === 'string' ? JSON.parse(cfg) : cfg;
    }
    return defaultBanners;
  }

  async updateBanner(payload) {
    const current = await this.getBanner();
    const merged = {
      left: {
        ...(current.left || defaultBanners.left),
        ...(payload.left || {})
      },
      right: {
        ...(current.right || defaultBanners.right),
        ...(payload.right || {})
      }
    };

    const jsonStr = JSON.stringify(merged);
    const sql = `
      INSERT INTO banners (id, config_json, created_at, updated_at)
      VALUES ('main_banner', ?, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET config_json = EXCLUDED.config_json, updated_at = NOW()
    `;
    await dbManager.query(sql, [jsonStr]);
    return merged;
  }

  async resetBanner() {
    const jsonStr = JSON.stringify(defaultBanners);
    const sql = `
      INSERT INTO banners (id, config_json, created_at, updated_at)
      VALUES ('main_banner', ?, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET config_json = EXCLUDED.config_json, updated_at = NOW()
    `;
    await dbManager.query(sql, [jsonStr]);
    return defaultBanners;
  }
}

module.exports = new BannerModel();

