const productModel = require('../models/productModel');

// 1. READ: Mengambil Daftar Produk dengan Filter & Search
exports.getProducts = async (req, res) => {
  try {
    const products = await productModel.findAll(req.query);
    return res.json({
      success: true,
      total: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error getProducts:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data produk dari database.',
      error: error.message
    });
  }
};

// 2. READ ONE: Mengambil Detail 1 Produk
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.'
      });
    }

    return res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error getProductById:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail produk.'
    });
  }
};

// 3. CREATE: Tambah Produk Baru (CRUD - C)
exports.createProduct = async (req, res) => {
  try {
    const { name, price, category } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama produk wajib diisi!'
      });
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Harga produk harus berupa angka valid di atas 0!'
      });
    }

    const newProduct = await productModel.create(req.body);

    return res.status(201).json({
      success: true,
      message: `Produk "${newProduct.name}" berhasil ditambahkan ke database!`,
      data: newProduct
    });
  } catch (error) {
    console.error('Error createProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan produk ke database.'
    });
  }
};

// 4. UPDATE: Memperbarui Data Produk (CRUD - U)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await productModel.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Produk yang ingin diperbarui tidak ditemukan.'
      });
    }

    const updated = await productModel.update(id, req.body);

    return res.json({
      success: true,
      message: `Produk "${updated.name}" berhasil diperbarui di database!`,
      data: updated
    });
  } catch (error) {
    console.error('Error updateProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data produk di database.'
    });
  }
};

// 5. DELETE: Menghapus Produk (CRUD - D)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await productModel.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Produk yang ingin dihapus tidak ditemukan.'
      });
    }

    const deleted = await productModel.delete(id);

    if (deleted) {
      return res.json({
        success: true,
        message: `Produk "${existing.name}" berhasil dihapus dari database.`
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus produk.'
      });
    }
  } catch (error) {
    console.error('Error deleteProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus produk dari database.'
    });
  }
};

// 6. READ CATEGORIES (168 Parts Official Categories)
exports.getCategories = (req, res) => {
  try {
    const categories = [
      { id: "lcd", name: "LCD & Layar", icon: "phone", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=160&auto=format&fit=crop&q=80" },
      { id: "baterai", name: "Baterai HP", icon: "battery", image: "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=160&auto=format&fit=crop&q=80" },
      { id: "ic", name: "IC & Chipset", icon: "cpu", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=160&auto=format&fit=crop&q=80" },
      { id: "tools", name: "Alat Servis & Blower", icon: "tool", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=160&auto=format&fit=crop&q=80" },
      { id: "solder", name: "Solder & Timah", icon: "flame", image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=160&auto=format&fit=crop&q=80" },
      { id: "lem", name: "Lem & Perekat", icon: "bottle", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=160&auto=format&fit=crop&q=80" },
      { id: "backdoor", name: "Backdoor & Kaca", icon: "shield", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&auto=format&fit=crop&q=80" },
      { id: "tester", name: "Alat Ukur & Tester", icon: "gauge", image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=160&auto=format&fit=crop&q=80" },
      { id: "pinset", name: "Pinset & Pembuka", icon: "scissors", image: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=160&auto=format&fit=crop&q=80" },
      { id: "fleksibel", name: "Sparepart Fleksibel", icon: "zap", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=160&auto=format&fit=crop&q=80" }
    ];

    return res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar kategori.'
    });
  }
};

// 7. READ FLASH SALE (Siklus 24 Jam - Reset Pukul 00:00:00 Tengah Malam WIB / Manual Admin)
exports.getFlashSale = async (req, res) => {
  try {
    const timing = productModel.getFlashSaleTiming();
    const flashSales = await productModel.findFlashSale();

    return res.json({
      success: true,
      cycleHours: 24,
      resetTime: timing.nextResetMs,
      secondsRemaining: timing.secondsRemaining,
      resetSchedule: timing.resetSchedule,
      isManualCycle: timing.isManualCycle,
      total: flashSales.length,
      data: flashSales
    });
  } catch (error) {
    console.error('Error getFlashSale:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat produk Flash Sale.',
      error: error.message
    });
  }
};

// 7.1. ADMIN CONTROL: Reset Siklus Flash Sale 24 Jam Sekarang
exports.resetFlashSaleCycle = async (req, res) => {
  try {
    const result = await productModel.resetFlashSaleCycle();
    const flashSales = await productModel.findFlashSale();

    return res.json({
      success: true,
      message: '⚡ Siklus Flash Sale 24 jam berhasil di-reset oleh Admin! Countdown dan progres dimulai dari 0 kembali.',
      data: flashSales,
      timing: result.timing
    });
  } catch (error) {
    console.error('Error resetFlashSaleCycle:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mereset siklus Flash Sale.',
      error: error.message
    });
  }
};

// 7.2. ADMIN CONTROL: Pilihkan 12 Produk Terlaris Otomatis Masuk Flash Sale
exports.autoSelectFlashSale = async (req, res) => {
  try {
    const limit = parseInt(req.body.limit, 10) || 12;
    const flashSales = await productModel.autoSelectFlashSale(limit);

    return res.json({
      success: true,
      message: `✨ Berhasil memilih ${flashSales.length} produk terlaris masuk ke daftar Flash Sale!`,
      data: flashSales
    });
  } catch (error) {
    console.error('Error autoSelectFlashSale:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengatur produk Flash Sale otomatis.',
      error: error.message
    });
  }
};

// 7.3. ADMIN CONTROL: Bersihkan Seluruh Produk dari Flash Sale
exports.clearAllFlashSale = async (req, res) => {
  try {
    await productModel.clearAllFlashSale();

    return res.json({
      success: true,
      message: 'Seluruh produk berhasil dikeluarkan dari Flash Sale toko.'
    });
  } catch (error) {
    console.error('Error clearAllFlashSale:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membersihkan Flash Sale.',
      error: error.message
    });
  }
};

// 8. IMPORT SHOPEE: Migrasi Massal Produk Shopee (Excel, JSON, atau Batch Items)
exports.importShopee = async (req, res) => {
  try {
    const ShopeeImporter = require('../utils/shopeeImporter');
    let { items, rawJson, fileBase64, replaceExisting } = req.body;
    let productsToImport = [];

    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, 'base64');
      productsToImport = ShopeeImporter.parseFile(buffer);
    } else if (rawJson) {
      const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
      const list = Array.isArray(parsed) ? parsed : (parsed.items || parsed.products || parsed.data || []);
      productsToImport = list.map((item, idx) => ShopeeImporter.normalizeProduct(item, idx));
    } else if (Array.isArray(items)) {
      productsToImport = items.map((item, idx) => ShopeeImporter.normalizeProduct(item, idx));
    } else {
      return res.status(400).json({
        success: false,
        message: 'Mohon sertakan data produk (file Excel/CSV Base64, rawJson, atau items array).'
      });
    }

    if (productsToImport.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data produk valid yang berhasil diurai dari sumber yang diberikan.'
      });
    }

    const result = await ShopeeImporter.saveBatchToDatabase(productsToImport, Boolean(replaceExisting));

    return res.json({
      success: true,
      message: result.message,
      count: result.count,
      totalReceived: result.totalReceived
    });
  } catch (error) {
    console.error('Error importShopee:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses migrasi produk Shopee: ' + error.message
    });
  }
};

