const userModel = require('../models/userModel');

exports.register = async (req, res) => {
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

    // Cek apakah email sudah terdaftar di database
    const existingUser = await userModel.findByEmail(emailNorm);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.'
      });
    }

    const coordinates = (latitude && longitude) ? { lat: Number(latitude), lng: Number(longitude) } : null;

    const newUser = await userModel.create({
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: emailNorm,
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      coordinates,
      role: 'buyer',
      points: 0,
      password
    });

    const token = userModel.generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Selamat datang di 168 Parts Surabaya.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        coordinates: newUser.coordinates,
        role: newUser.role,
        points: newUser.points || 0
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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi!'
      });
    }

    const emailNorm = email.trim().toLowerCase();

    // Query user dari Database Supabase Cloud
    const user = await userModel.findByEmail(emailNorm);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.'
      });
    }

    const isMatch = userModel.verifyPassword(password, user.salt, user.hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.'
      });
    }

    const token = userModel.generateToken(user);

    return res.json({
      success: true,
      message: `Selamat datang kembali, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
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

exports.getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan di database.'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: (user.email ? user.email.split('@')[0] : 'user') + (user.id.slice(-4)),
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        role: user.role || 'buyer',
        points: user.points || 0,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil pengguna dari database.'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, coordinates, password } = req.body;

    const updated = await userModel.update(userId, {
      name,
      phone,
      address,
      coordinates,
      password
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.'
      });
    }

    const newToken = userModel.generateToken(updated);

    return res.json({
      success: true,
      message: 'Profil berhasil diperbarui di database!',
      token: newToken,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone || '',
        address: updated.address || '',
        role: updated.role,
        points: updated.points || 0
      }
    });
  } catch (error) {
    console.error('Error updateProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui profil pengguna di database.'
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini dan password baru wajib diisi.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter.'
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.'
      });
    }

    const isMatch = userModel.verifyPassword(currentPassword, user.salt, user.hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password saat ini tidak sesuai.'
      });
    }

    const updated = await userModel.update(userId, { password: newPassword });
    if (!updated) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan kata sandi baru di database.'
      });
    }

    return res.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui dengan aman!'
    });
  } catch (error) {
    console.error('Error changePassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat merubah kata sandi.'
    });
  }
};

exports.logout = (req, res) => {
  return res.json({
    success: true,
    message: 'Berhasil keluar (logout).'
  });
};
