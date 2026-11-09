const cartModel = require('../models/cartModel');

function getCartOwnerKey(req) {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  return req.headers['x-session-id'] || 'guest-default';
}

exports.getCart = async (req, res) => {
  try {
    const ownerKey = getCartOwnerKey(req);
    const items = await cartModel.getCart(ownerKey);

    const totalQuantity = items.reduce((acc, curr) => acc + curr.quantity, 0);
    const subtotal = items.reduce((acc, curr) => acc + curr.itemTotal, 0);

    return res.json({
      success: true,
      data: {
        items,
        totalQuantity,
        subtotal
      }
    });
  } catch (error) {
    console.error('Error getCart:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data keranjang belanja dari database.'
    });
  }
};

exports.addToCart = async (req, res) => {
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
    const items = await cartModel.addItem(ownerKey, productId, qty);

    const totalQuantity = items.reduce((acc, curr) => acc + curr.quantity, 0);
    const subtotal = items.reduce((acc, curr) => acc + curr.itemTotal, 0);

    return res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan ke keranjang!',
      data: {
        items,
        totalQuantity,
        subtotal
      }
    });
  } catch (error) {
    console.error('Error addToCart:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan produk ke keranjang.'
    });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const ownerKey = getCartOwnerKey(req);
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Parameter productId dan quantity wajib diisi.'
      });
    }

    const items = await cartModel.updateQuantity(ownerKey, productId, quantity);
    const totalQuantity = items.reduce((acc, curr) => acc + curr.quantity, 0);
    const subtotal = items.reduce((acc, curr) => acc + curr.itemTotal, 0);

    return res.json({
      success: true,
      message: 'Jumlah produk di keranjang berhasil diperbarui!',
      data: {
        items,
        totalQuantity,
        subtotal
      }
    });
  } catch (error) {
    console.error('Error updateQuantity:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui jumlah produk di keranjang.'
    });
  }
};

exports.removeFromCart = exports.removeItem = async (req, res) => {
  try {
    const ownerKey = getCartOwnerKey(req);
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Parameter productId wajib disertakan.'
      });
    }

    const items = await cartModel.removeItem(ownerKey, productId);
    const totalQuantity = items.reduce((acc, curr) => acc + curr.quantity, 0);
    const subtotal = items.reduce((acc, curr) => acc + curr.itemTotal, 0);

    return res.json({
      success: true,
      message: 'Produk berhasil dihapus dari keranjang belanja.',
      data: {
        items,
        totalQuantity,
        subtotal
      }
    });
  } catch (error) {
    console.error('Error removeItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus produk dari keranjang.'
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const ownerKey = getCartOwnerKey(req);
    await cartModel.clearCart(ownerKey);

    return res.json({
      success: true,
      message: 'Seluruh isi keranjang berhasil dikosongkan.',
      data: {
        items: [],
        totalQuantity: 0,
        subtotal: 0
      }
    });
  } catch (error) {
    console.error('Error clearCart:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengosongkan keranjang belanja.'
    });
  }
};
