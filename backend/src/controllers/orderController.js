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
      discountAmount = 0,
      redeemedPoints = 0
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

    // Ambil saldo poin user saat ini dari Supabase
    const currentUser = await userModel.findById(userId);
    const currentBalance = currentUser ? Number(currentUser.points || 0) : 0;

    // 1 Poin = Rp1. Maksimal poin yang bisa ditukar tidak melebihi sisa tagihan (subtotal - disc) dan saldo user
    const requestedPoints = Math.max(0, parseInt(redeemedPoints, 10) || 0);
    const billBeforePoints = Math.max(0, subtotal - disc);
    const pointsToUse = Math.min(requestedPoints, currentBalance, billBeforePoints);

    // Total bayar akhir setelah potongan voucher dan koin/poin
    const totalAmount = Math.max(0, billBeforePoints - pointsToUse);
    // Dapatkan poin baru dari nilai rupiah yang dibayarkan (1 Poin tiap Rp1.000)
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
      redeemedPoints: pointsToUse,
      earnedPoints,
      status: 'Sedang Diproses'
    });

    // 1. Kurangi poin jika ada penukaran poin saat checkout (1 Poin = Rp1)
    if (pointsToUse > 0) {
      await userModel.deductPoints(userId, pointsToUse);
    }

    // 2. Tambahkan poin baru yang diperoleh dari transaksi belanja (1 Poin / Rp1.000)
    let finalUserPoints = currentBalance - pointsToUse;
    if (earnedPoints > 0) {
      finalUserPoints = await userModel.addPoints(userId, earnedPoints);
    } else {
      const updatedUser = await userModel.findById(userId);
      finalUserPoints = updatedUser ? Number(updatedUser.points || 0) : finalUserPoints;
    }

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
      redeemedPoints: pointsToUse,
      earnedPoints,
      userPoints: finalUserPoints
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
