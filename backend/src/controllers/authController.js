const storage = require('../models/storage');

exports.register = (req, res) => {
  try {
    const { name, email, phone, password, address, latitude, longitude } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi!'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter!'
      });
    }

    const emailNorm = email.trim().toLowerCase();

    // Proteksi: Hanya ada 1 akun administrator tunggal di sistem (admin@pasarin.com)
    if (emailNorm === 'admin@pasarin.com' || emailNorm.startsWith('admin@')) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Akun administrator bersifat privat & tunggal (admin@pasarin.com). Pendaftaran akun admin baru tidak diperbolehkan.'
      });
    }

    const db = storage.read();

    const existingUser = db.users.find(u => u.email.toLowerCase() === emailNorm);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.'
      });
    }

    const { salt, hash } = storage.hashPassword(password);
    const newUser = {
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: emailNorm,
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      coordinates: (latitude && longitude) ? { lat: Number(latitude), lng: Number(longitude) } : null,
      role: 'buyer', // Selalu buyer, akun admin tunggal tidak bisa digandakan
      points: 0,
      salt,
      hash,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    storage.write(db);

    const token = storage.generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Selamat datang di Pasarin.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        coordinates: newUser.coordinates,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error register:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat registrasi.'
    });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi!'
      });
    }

    const emailNorm = email.trim().toLowerCase();
    const db = storage.read();

    const user = db.users.find(u => u.email.toLowerCase() === emailNorm);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.'
      });
    }

    const isMatch = storage.verifyPassword(password, user.salt, user.hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.'
      });
    }

    const token = storage.generateToken(user);

    return res.json({
      success: true,
      message: `Selamat datang kembali, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        points: user.points || 0
      }
    });
  } catch (error) {
    console.error('Error login:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat login.'
    });
  }
};

exports.getMe = (req, res) => {
  try {
    const db = storage.read();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username || (user.email ? user.email.split('@')[0] : 'user') + (user.id.slice(-4)),
        email: user.email,
        phone: user.phone || '',
        shopName: user.shopName || (user.name ? user.name + ' Store' : '168Parts Official'),
        gender: user.gender || 'Lainnya',
        birthDate: user.birthDate || '',
        avatar: user.avatar || '',
        address: user.address || '',
        role: user.role || 'buyer',
        points: user.points || 0,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil pengguna.'
    });
  }
};

exports.updateProfile = (req, res) => {
  try {
    const userId = req.user.id;
    const db = storage.read();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.'
      });
    }

    const {
      name,
      username,
      email,
      phone,
      shopName,
      gender,
      birthDate,
      avatar,
      address
    } = req.body;

    if (name && name.trim()) user.name = name.trim();
    if (username !== undefined) user.username = username.trim();
    if (email && email.trim()) user.email = email.trim().toLowerCase();
    if (phone !== undefined) user.phone = phone.trim();
    if (shopName !== undefined) user.shopName = shopName.trim();
    if (gender !== undefined) user.gender = gender;
    if (birthDate !== undefined) user.birthDate = birthDate;
    if (avatar !== undefined) user.avatar = avatar;
    if (address !== undefined) user.address = address;

    storage.write(db);

    const newToken = storage.generateToken(user);

    return res.json({
      success: true,
      message: 'Profil berhasil diperbarui!',
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username || (user.email ? user.email.split('@')[0] : 'user'),
        email: user.email,
        phone: user.phone || '',
        shopName: user.shopName || '',
        gender: user.gender || 'Lainnya',
        birthDate: user.birthDate || '',
        avatar: user.avatar || '',
        address: user.address || '',
        role: user.role || 'buyer',
        points: user.points || 0
      }
    });
  } catch (error) {
    console.error('Error updateProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui profil pengguna.'
    });
  }
};

exports.logout = (req, res) => {
  return res.json({
    success: true,
    message: 'Berhasil keluar (logout).'
  });
};

