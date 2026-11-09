const bannerModel = require('../models/bannerModel');

exports.getBanners = async (req, res) => {
  try {
    const banners = await bannerModel.getBanner();
    return res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error getBanners:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data banner dari database.'
    });
  }
};

exports.updateBanners = async (req, res) => {
  try {
    const updated = await bannerModel.updateBanner(req.body);
    return res.json({
      success: true,
      message: 'Konfigurasi banner berhasil diperbarui di database!',
      data: updated
    });
  } catch (error) {
    console.error('Error updateBanners:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui konfigurasi banner di database.'
    });
  }
};

exports.resetBanners = async (req, res) => {
  try {
    const reset = await bannerModel.resetBanner();
    return res.json({
      success: true,
      message: 'Banner berhasil direset ke pengaturan default 168 Parts!',
      data: reset
    });
  } catch (error) {
    console.error('Error resetBanners:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mereset konfigurasi banner.'
    });
  }
};
