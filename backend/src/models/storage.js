const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/config');
const seedProducts = require('../../data/seedProducts');

class Storage {
  constructor() {
    this.filePath = config.dataPath;
    this.ensureDbExists();
  }

  hashPassword(password, salt) {
    if (!salt) {
      salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
  }

  verifyPassword(password, salt, hash) {
    const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return checkHash === hash;
  }

  generateToken(user) {
    const payload = JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'buyer',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
    const signature = crypto.createHmac('sha256', config.jwtSecret).update(payload).digest('hex');
    return Buffer.from(payload).toString('base64url') + '.' + signature;
  }

  verifyToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    try {
      const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const expectedSignature = crypto.createHmac('sha256', config.jwtSecret).update(payloadStr).digest('hex');
      if (expectedSignature !== signature) return null;
      const data = JSON.parse(payloadStr);
      if (data.exp && data.exp < Date.now()) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  ensureDbExists() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.filePath)) {
      const userDemo = this.hashPassword('demo123');
      const userAdmin = this.hashPassword('admin123');

      const initialData = {
        users: [
          {
            id: 'user-demo-1',
            email: 'demo@pasarin.com',
            name: 'Budi Santoso',
            phone: '081234567890',
            role: 'buyer',
            salt: userDemo.salt,
            hash: userDemo.hash,
            createdAt: new Date().toISOString()
          },
          {
            id: 'user-admin-1',
            email: 'admin@pasarin.com',
            name: 'Admin Pasarin',
            phone: '081122334455',
            role: 'admin',
            salt: userAdmin.salt,
            hash: userAdmin.hash,
            createdAt: new Date().toISOString()
          }
        ],
        products: seedProducts,
        carts: {
          'user-demo-1': [
            {
              productId: 'prod-1',
              quantity: 1,
              addedAt: new Date().toISOString()
            },
            {
              productId: 'prod-5',
              quantity: 2,
              addedAt: new Date().toISOString()
            }
          ]
        },
        orders: [
          {
            id: 'ORD-2026-001',
            userId: 'user-demo-1',
            items: [
              {
                id: 'prod-3',
                name: 'Smartwatch Ultra Series 9 Titanium',
                price: 489000,
                quantity: 1,
                icon: 'watch'
              }
            ],
            shippingAddress: 'Jl. Merdeka No. 45, Jakarta Barat',
            paymentMethod: 'GoPay',
            totalAmount: 489000,
            status: 'Sedang Dikirim',
            createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
          }
        ]
      };
      fs.writeFileSync(this.filePath, JSON.stringify(initialData, null, 2), 'utf8');
    }
  }

  read() {
    this.ensureDbExists();
    try {
      const content = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading DB:', e);
      return { users: [], products: [], carts: {}, orders: [] };
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Error writing DB:', e);
      return false;
    }
  }
}

module.exports = new Storage();

