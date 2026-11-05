const storage = require('../models/storage');

function getCartOwnerKey(req) {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  return req.headers['x-session-id'] || 'guest-default';
}

exports.getCart = (req, res) => {
  try {
    const ownerKey = getCartOwnerKey(req);
    const db = storage.read();
    const cartItems = db.carts[ownerKey] || [];

    // Map item dengan data produk terkini
    const enrichedItems = cartItems.map(item => {
      const product = db.products.find(p => p.id === item.productId);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        icon: product.icon,
        image: product.image,
        bgPattern: product.bgPattern,
        shopName: product.shopName,
        stock: product.stock,
        quantity: item.quantity,
        itemTotal: product.price * item.quantity
      };
    }).filter(Boolean);

    const totalQuantity = enrichedItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const subtotal = enrichedItems.reduce((acc, curr) => acc + curr.itemTotal, 0);

    return res.json({
      success: true,
      data: {
        items: enrichedItems,
        totalQuantity,
        subtotal
      }
    });
  } catch (error) {
    console.error('Error getCart:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data keranjang belanja.'
    });
  }
};

exports.addToCart = (req, res) => {
  try {
    const ownerKey = getCartOwnerKey(req);
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID wajib disertakan.'
      });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const db = storage.read();

    let product = db.products.find(p => p.id === productId);
    if (!product) {
      product = {
        id: productId,
        name: req.body.name || 'Produk Pilihan',
        price: Number(req.body.price) || 150000,
        originalPrice: Number(req.body.originalPrice) || 200000,
        image: req.body.image || null,
        shopName: req.body.shopName || 'Pasarin Store'
      };
    }

    if (!db.carts[ownerKey]) {
      db.carts[ownerKey] = [];
    }

    const existingIndex = db.carts[ownerKey].findIndex(i => i.productId === productId);
    if (existingIndex > -1) {
      db.carts[ownerKey][existingIndex].quantity += qty;
    } else {
      db.carts[ownerKey].push({
        productId,
        quantity: qty,
        addedAt: new Date().toISOString()
      });
    }

    storage.write(db);

    return res.json({
      success: true,
      message: `Berhasil menambahkan "${product.name}" ke keranjang!`,
      cartCount: db.carts[ownerKey].reduce((sum, it) => sum + it.quantity, 0)
    });
  } catch (error) {
    console.error('Error addToCart:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan produk ke keranjang.'
    });
  }
};

exports.updateQuantity = (req, res) => {
  try {
    const ownerKey = getCartOwnerKey(req);
    const { productId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    const db = storage.read();

    if (!db.carts[ownerKey]) {
      db.carts[ownerKey] = [];
    }

    if (qty <= 0) {
      db.carts[ownerKey] = db.carts[ownerKey].filter(i => i.productId !== productId);
    } else {
      const item = db.carts[ownerKey].find(i => i.productId === productId);
      if (item) {
        item.quantity = qty;
      }
    }

    storage.write(db);

    return res.json({
      success: true,
      message: 'Jumlah produk berhasil diperbarui.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui kuantitas produk.'
    });
  }
};

exports.removeFromCart = (req, res) => {
  try {
    const ownerKey = getCartOwnerKey(req);
    const { productId } = req.params;
    const db = storage.read();

    if (db.carts[ownerKey]) {
      db.carts[ownerKey] = db.carts[ownerKey].filter(i => i.productId !== productId);
      storage.write(db);
    }

    return res.json({
      success: true,
      message: 'Produk berhasil dihapus dari keranjang.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus produk dari keranjang.'
    });
  }
};

exports.clearCart = (req, res) => {
  try {
    const ownerKey = getCartOwnerKey(req);
    const db = storage.read();
    db.carts[ownerKey] = [];
    storage.write(db);

    return res.json({
      success: true,
      message: 'Keranjang berhasil dikosongkan.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengosongkan keranjang.'
    });
  }
};

