const crypto = require('crypto');
const dbManager = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'pasarin-marketplace-super-secret-key-2026';

class UserModel {
  // Hash password dengan salt
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
  }

  // Verifikasi kecocokan password
  verifyPassword(password, salt, hash) {
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  // Buat token JWT sederhana (Base64 URL-safe signed token)
  generateToken(user) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 hari
    })).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  // Verifikasi token JWT
  verifyToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;
      const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
      if (signature !== expectedSignature) return null;

      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (data.exp && data.exp < Date.now()) return null; // Expired
      return data;
    } catch (e) {
      return null;
    }
  }

  formatUser(row) {
    if (!row) return null;
    let coords = null;
    if (row.coordinates) {
      try {
        coords = typeof row.coordinates === 'string' ? JSON.parse(row.coordinates) : row.coordinates;
      } catch (e) {
        coords = null;
      }
    }
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      address: row.address || '',
      coordinates: coords,
      role: row.role || 'buyer',
      points: Number(row.points || 0),
      salt: row.salt,
      hash: row.hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const rows = await dbManager.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [cleanEmail]
    );
    if (rows && rows.length > 0) {
      return this.formatUser(rows[0]);
    }
    return null;
  }

  async findById(id) {
    if (!id) return null;
    const rows = await dbManager.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows && rows.length > 0) {
      return this.formatUser(rows[0]);
    }
    return null;
  }

  async create(data) {
    const id = data.id || ('user-' + Date.now());
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();
    const phone = (data.phone || '').trim();
    const address = (data.address || '').trim();
    const role = data.role || 'buyer';
    const points = Number(data.points || 0);
    const coordinates = data.coordinates ? JSON.stringify(data.coordinates) : null;

    let salt = data.salt;
    let hash = data.hash;
    if (!salt || !hash) {
      const hashed = this.hashPassword(data.password || 'password123');
      salt = hashed.salt;
      hash = hashed.hash;
    }

    const sql = `
      INSERT INTO users (id, name, email, phone, address, coordinates, role, points, salt, hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await dbManager.query(sql, [
      id, name, email, phone, address, coordinates, role, points, salt, hash
    ]);

    return await this.findById(id);
  }

  async update(id, fields = {}) {
    const sets = [];
    const params = [];

    if (fields.name !== undefined) {
      sets.push('name = ?');
      params.push(fields.name.trim());
    }
    if (fields.phone !== undefined) {
      sets.push('phone = ?');
      params.push(fields.phone.trim());
    }
    if (fields.address !== undefined) {
      sets.push('address = ?');
      params.push(fields.address.trim());
    }
    if (fields.points !== undefined) {
      sets.push('points = ?');
      params.push(Number(fields.points));
    }
    if (fields.coordinates !== undefined) {
      sets.push('coordinates = ?');
      params.push(fields.coordinates ? JSON.stringify(fields.coordinates) : null);
    }
    if (fields.role !== undefined) {
      sets.push('role = ?');
      params.push(fields.role);
    }
    if (fields.password) {
      const { salt, hash } = this.hashPassword(fields.password);
      sets.push('salt = ?');
      params.push(salt);
      sets.push('hash = ?');
      params.push(hash);
    }

    if (sets.length === 0) return await this.findById(id);

    sets.push('updated_at = NOW()');
    params.push(id);

    const sql = `UPDATE users SET ${sets.join(', ')} WHERE id = ?`;
    await dbManager.query(sql, params);

    return await this.findById(id);
  }

  async addPoints(id, earnedPoints) {
    const user = await this.findById(id);
    if (!user) return 0;
    const newPoints = (user.points || 0) + earnedPoints;
    await dbManager.query('UPDATE users SET points = ?, updated_at = NOW() WHERE id = ?', [newPoints, id]);
    return newPoints;
  }

  async ensureDefaultUsers() {
    try {
      // 1. Admin 168 Parts
      const admin168 = await this.findByEmail('admin@168parts.com');
      if (!admin168) {
        const { salt, hash } = this.hashPassword('admin123');
        await this.create({
          id: 'user-admin-168',
          name: 'Super Admin 168 Parts',
          email: 'admin@168parts.com',
          phone: '081122334455',
          address: 'Surabaya, Jawa Timur',
          role: 'admin',
          points: 9999,
          salt,
          hash
        });
        console.log('✅ Akun Admin admin@168parts.com (pwd: admin123) dibuat di Supabase.');
      }

      // 2. Admin Pasarin (kompatibilitas)
      const adminOld = await this.findByEmail('admin@pasarin.com');
      if (!adminOld) {
        const { salt, hash } = this.hashPassword('admin123');
        await this.create({
          id: 'user-admin-1',
          name: 'Super Admin Pasarin',
          email: 'admin@pasarin.com',
          phone: '081122334455',
          address: 'Surabaya, Jawa Timur',
          role: 'admin',
          points: 5000,
          salt,
          hash
        });
      }

      // 3. User Demo
      const demoUser = await this.findByEmail('demo@pasarin.com');
      if (!demoUser) {
        const { salt, hash } = this.hashPassword('demo123');
        await this.create({
          id: 'user-demo-1',
          name: 'Budi Santoso',
          email: 'demo@pasarin.com',
          phone: '081234567890',
          address: 'Surabaya, Jawa Timur',
          role: 'buyer',
          points: 250,
          salt,
          hash
        });
      }
    } catch (e) {
      console.warn('⚠️ Gagal memverifikasi user default:', e.message);
    }
  }
}

module.exports = new UserModel();
