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
      message: 'Gagal mengambil data produk dari database.'
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

// 6. READ CATEGORIES
exports.getCategories = (req, res) => {
  try {
    const categories = [
      { id: "elektronik", name: "Elektronik", icon: "head", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=160&auto=format&fit=crop&q=80" },
      { id: "komputer", name: "Komputer & Aksesoris", icon: "laptop", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=160&auto=format&fit=crop&q=80" },
      { id: "hp", name: "Handphone & Aksesoris", icon: "phone", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&auto=format&fit=crop&q=80" },
      { id: "pakaian-pria", name: "Pakaian Pria", icon: "shirt", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=160&auto=format&fit=crop&q=80" },
      { id: "sepatu-pria", name: "Sepatu Pria", icon: "shoe", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=80" },
      { id: "tas-pria", name: "Tas Pria", icon: "bag2", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=160&auto=format&fit=crop&q=80" },
      { id: "aksesoris", name: "Aksesoris Fashion", icon: "ring", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=160&auto=format&fit=crop&q=80" },
      { id: "jam-tangan", name: "Jam Tangan", icon: "watch", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=160&auto=format&fit=crop&q=80" },
      { id: "kesehatan", name: "Kesehatan", icon: "health", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=160&auto=format&fit=crop&q=80" },
      { id: "hobi", name: "Hobi & Koleksi", icon: "game", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=160&auto=format&fit=crop&q=80" },
      { id: "makanan", name: "Makanan & Minuman", icon: "food", image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=160&auto=format&fit=crop&q=80" },
      { id: "kecantikan", name: "Perawatan & Kecantikan", icon: "beauty", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=160&auto=format&fit=crop&q=80" },
      { id: "rumah", name: "Perlengkapan Rumah", icon: "home", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=160&auto=format&fit=crop&q=80" },
      { id: "pakaian-wanita", name: "Pakaian Wanita", icon: "dress", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=160&auto=format&fit=crop&q=80" },
      { id: "fashion-muslim", name: "Fashion Muslim", icon: "moon", image: "https://images.unsplash.com/photo-1585728748178-577629505238?w=160&auto=format&fit=crop&q=80" },
      { id: "fashion-bayi", name: "Fashion Bayi & Anak", icon: "baby", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=160&auto=format&fit=crop&q=80" },
      { id: "ibu-bayi", name: "Ibu & Bayi", icon: "baby", image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=160&auto=format&fit=crop&q=80" },
      { id: "sepatu-wanita", name: "Sepatu Wanita", icon: "heel", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=160&auto=format&fit=crop&q=80" },
      { id: "tas-wanita", name: "Tas Wanita", icon: "handbag", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=160&auto=format&fit=crop&q=80" },
      { id: "otomotif", name: "Otomotif", icon: "moto", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=160&auto=format&fit=crop&q=80" }
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

// 7. READ FLASH SALE
exports.getFlashSale = async (req, res) => {
  try {
    const flashSales = await productModel.findFlashSale();
    return res.json({
      success: true,
      endTime: Date.now() + (3 * 3600 + 45 * 60) * 1000,
      data: flashSales
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat produk Flash Sale.'
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

