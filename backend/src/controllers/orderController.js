const storage = require('../models/storage');

exports.checkout = (req, res) => {
  try {
    const userId = req.user.id;
    const {
      shippingAddress,
      paymentMethod = 'GoPay',
      notes = ''
    } = req.body;

    if (!shippingAddress || !shippingAddress.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Alamat pengiriman wajib diisi!'
      });
    }

    const db = storage.read();
    const userCart = db.carts[userId] || [];

    if (userCart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja Anda masih kosong.'
      });
    }

    const items = userCart.map(it => {
      const p = db.products.find(x => x.id === it.productId);
      return {
        id: p ? p.id : it.productId,
        name: p ? p.name : 'Produk',
        price: p ? p.price : 0,
        quantity: it.quantity,
        icon: p ? p.icon : 'bag',
        itemTotal: (p ? p.price : 0) * it.quantity
      };
    });

    const totalAmount = items.reduce((sum, it) => sum + it.itemTotal, 0);

    // Hitung poin: 1 Poin tiap Rp 1.000 total checkout
    const earnedPoints = Math.floor(totalAmount / 1000);

    const dbUser = db.users.find(u => u.id === userId);
    if (dbUser) {
      dbUser.points = (dbUser.points || 0) + earnedPoints;
    }

    const newOrder = {
      id: 'ORD-' + Date.now().toString(36).toUpperCase(),
      userId,
      items,
      shippingAddress: shippingAddress.trim(),
      paymentMethod,
      notes: notes.trim(),
      totalAmount,
      earnedPoints,
      status: 'Sedang Diproses',
      createdAt: new Date().toISOString()
    };

    if (!db.orders) {
      db.orders = [];
    }
    db.orders.unshift(newOrder);

    // Kosongkan keranjang setelah checkout sukses
    db.carts[userId] = [];
    storage.write(db);

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat! Terima kasih telah berbelanja di Pasarin.',
      order: newOrder,
      earnedPoints,
      userPoints: dbUser ? dbUser.points : earnedPoints
    });
  } catch (error) {
    console.error('Error checkout:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses checkout pesanan.'
    });
  }
};

exports.getMyOrders = (req, res) => {
  try {
    const userId = req.user.id;
    const db = storage.read();
    const orders = (db.orders || []).filter(o => o.userId === userId);

    return res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat pesanan.'
    });
  }
};

exports.getAllOrders = (req, res) => {
  try {
    const db = storage.read();
    const orders = db.orders || [];
    return res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data semua pesanan.'
    });
  }
};

exports.updateOrderStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = storage.read();
    const order = (db.orders || []).find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }
    order.status = status || order.status;
    storage.write(db);
    return res.json({ success: true, message: 'Status pesanan berhasil diperbarui', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status pesanan' });
  }
};

