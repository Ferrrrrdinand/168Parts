const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const userModel = require('../models/userModel');
const promoModel = require('../models/promoModel');

exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      shippingAddress,
      paymentMethod = 'GoPay',
      notes = '',
      promoCode = null,
      discountAmount = 0
    } = req.body;

    if (!shippingAddress || !shippingAddress.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Alamat pengiriman wajib diisi!'
      });
    }

    const cartItems = await cartModel.getCart(userId);
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja Anda masih kosong.'
      });
    }

    const items = cartItems.map(it => ({
      id: it.productId,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      icon: it.icon || 'bag',
      image: it.image || null,
      itemTotal: it.itemTotal
    }));

    const subtotal = items.reduce((sum, it) => sum + it.itemTotal, 0);
    const disc = Number(discountAmount || 0);
    const totalAmount = Math.max(0, subtotal - disc);
    const earnedPoints = Math.floor(totalAmount / 1000);

    const newOrder = await orderModel.create({
      id: 'ORD-' + Date.now().toString(36).toUpperCase(),
      userId,
      items,
      shippingAddress: shippingAddress.trim(),
      paymentMethod,
      notes: notes.trim(),
      totalAmount,
      subtotal,
      promoCode,
      discountAmount: disc,
      earnedPoints,
      status: 'Sedang Diproses'
    });

    // Update poin user di Supabase
    const userPoints = await userModel.addPoints(userId, earnedPoints);

    // Jika pesanan memakai voucher promo, tandai 1 voucher terpakai
    if (promoCode) {
      await promoModel.useVoucher(userId, promoCode);
    }

    // Bersihkan keranjang belanja di database
    await cartModel.clearCart(userId);

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat! Terima kasih telah berbelanja di 168 Parts Surabaya.',
      order: newOrder,
      earnedPoints,
      userPoints
    });
  } catch (error) {
    console.error('Error checkout:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses checkout pesanan ke database.'
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel.findByUserId(userId);
    return res.json({
      success: true,
      total: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error getMyOrders:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat pesanan dari database.'
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.findAll();
    return res.json({
      success: true,
      total: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error getAllOrders:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data seluruh pesanan dari database.'
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status pesanan wajib disertakan.'
      });
    }

    const updated = await orderModel.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan di database.'
      });
    }

    return res.json({
      success: true,
      message: 'Status pesanan berhasil diperbarui di database.',
      order: updated
    });
  } catch (error) {
    console.error('Error updateOrderStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status pesanan.'
    });
  }
};
