const userModel = require('../models/userModel');

// Helper validasi kekuatan password: min 8 karakter, huruf besar & kecil, angka, dan karakter spesial
function validatePasswordRequirements(pwd) {
  if (!pwd) return { isValid: false, message: 'Password wajib diisi!' };
  
  if (pwd.length < 8) {
    return { isValid: false, message: 'Password minimal 8 karakter!' };
  }
  if (!/[A-Z]/.test(pwd)) {
    return { isValid: false, message: 'Password harus mengandung minimal 1 huruf besar (A-Z)!' };
  }
  if (!/[a-z]/.test(pwd)) {
    return { isValid: false, message: 'Password harus mengandung minimal 1 huruf kecil (a-z)!' };
  }
  if (!/[0-9]/.test(pwd)) {
    return { isValid: false, message: 'Password harus mengandung minimal 1 angka (0-9)!' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd) && !/[^A-Za-z0-9]/.test(pwd)) {
    return { isValid: false, message: 'Password harus mengandung minimal 1 karakter spesial/simbol (@, #, $, %, !, dll)!' };
  }

  return { isValid: true };
}

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, address, latitude, longitude } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi!'
      });
    }

    const pwdCheck = validatePasswordRequirements(password);
    if (!pwdCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: pwdCheck.message
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
        username: newUser.username || (newUser.email.split('@')[0] + newUser.id.slice(-4)),
        email: newUser.email,
        phone: newUser.phone || '',
        address: newUser.address || '',
        shopName: newUser.shopName || '',
        gender: newUser.gender || '',
        birthDate: newUser.birthDate || '',
        avatar: newUser.avatar || '',
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
        username: user.username || (user.email ? user.email.split('@')[0] : 'user') + (user.id ? String(user.id).slice(-4) : ''),
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        shopName: user.shopName || '',
        gender: user.gender || '',
        birthDate: user.birthDate || '',
        avatar: user.avatar || '',
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
        username: user.username || (user.email ? user.email.split('@')[0] : 'user') + (user.id ? String(user.id).slice(-4) : ''),
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        shopName: user.shopName || '',
        gender: user.gender || '',
        birthDate: user.birthDate || '',
        avatar: user.avatar || '',
        coordinates: user.coordinates,
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
    const {
      name,
      username,
      email,
      phone,
      shopName,
      shop_name,
      gender,
      birthDate,
      birth_date,
      avatar,
      address,
      coordinates,
      password
    } = req.body;

    const updated = await userModel.update(userId, {
      name,
      username,
      email,
      phone,
      shopName: shopName !== undefined ? shopName : shop_name,
      gender,
      birthDate: birthDate !== undefined ? birthDate : birth_date,
      avatar,
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
      message: 'Profil berhasil diperbarui dan tersimpan di database!',
      token: newToken,
      user: {
        id: updated.id,
        name: updated.name,
        username: updated.username,
        email: updated.email,
        phone: updated.phone || '',
        address: updated.address || '',
        shopName: updated.shopName || '',
        gender: updated.gender || '',
        birthDate: updated.birthDate || '',
        avatar: updated.avatar || '',
        coordinates: updated.coordinates,
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

    const pwdCheck = validatePasswordRequirements(newPassword);
    if (!pwdCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: pwdCheck.message
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

// Ambil seluruh daftar akun pelanggan & pengguna terdaftar untuk Admin
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await userModel.findAllWithStats();
    return res.json({
      success: true,
      total: customers.length,
      customers
    });
  } catch (error) {
    console.error('Error getAllCustomers:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data akun pelanggan dari database.'
    });
  }
};

// Ambil detail profil pelanggan dan seluruh riwayat pesanannya untuk Admin
exports.getCustomerDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID pelanggan wajib disertakan.'
      });
    }

    const customer = await userModel.getCustomerDetail(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Data pelanggan tidak ditemukan.'
      });
    }

    return res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error getCustomerDetail:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail data pelanggan.'
    });
  }
};
