const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../../data/pasarin_local.db');
const jsonPath = path.resolve(__dirname, '../../data/db.json');
const sqlDumpPath = path.resolve(__dirname, '../../data/pasarin_database_full.sql');

const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const db = new sqlite3.Database(dbPath);

db.serialize(async () => {
  // 1. Sync Banners
  if (jsonData.banners) {
    const bannerJson = JSON.stringify(jsonData.banners);
    db.run(
      `INSERT OR REPLACE INTO banners (id, config_json, updated_at) VALUES ('main_banner', ?, CURRENT_TIMESTAMP)`,
      [bannerJson],
      (err) => {
        if (err) console.error('Error insert banners:', err);
        else console.log('✅ Banners berhasil disimpan ke SQLite!');
      }
    );
  }

  // 2. Sync Users (Admin & Pembeli)
  if (jsonData.users && Array.isArray(jsonData.users)) {
    const stmtUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, phone, role, salt, hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of jsonData.users) {
      stmtUser.run([
        u.id,
        u.name,
        u.email,
        u.phone || null,
        u.role || 'buyer',
        u.salt,
        u.hash,
        u.createdAt || new Date().toISOString()
      ]);
    }
    stmtUser.finalize((err) => {
      if (err) console.error('Error insert users:', err);
      else console.log(`✅ ${jsonData.users.length} Akun (Admin & Pembeli) berhasil disimpan ke SQLite!`);
    });
  }

  // 3. Sync Orders
  if (jsonData.orders && Array.isArray(jsonData.orders)) {
    const stmtOrder = db.prepare(`
      INSERT OR REPLACE INTO orders (id, user_id, items, shipping_address, payment_method, notes, total_amount, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const o of jsonData.orders) {
      stmtOrder.run([
        o.id,
        o.userId || o.user_id,
        typeof o.items === 'string' ? o.items : JSON.stringify(o.items || []),
        typeof o.shippingAddress === 'string' ? o.shippingAddress : JSON.stringify(o.shippingAddress || o.shipping_address || ''),
        o.paymentMethod || o.payment_method || 'COD',
        o.notes || null,
        o.totalAmount || o.total_amount || 0,
        o.status || 'Sedang Diproses',
        o.createdAt || o.created_at || new Date().toISOString()
      ]);
    }
    stmtOrder.finalize((err) => {
      if (err) console.error('Error insert orders:', err);
      else console.log(`✅ ${jsonData.orders.length} Pesanan berhasil disimpan ke SQLite!`);
    });
  }

  // 4. Generate Master SQL Dump File (Bisa di-import ke MySQL / phpMyAdmin / SQLite)
  db.all('SELECT * FROM products', (err, products) => {
    db.all('SELECT * FROM promos', (err2, promos) => {
      db.all('SELECT * FROM users', (err3, users) => {
        db.all('SELECT * FROM orders', (err4, orders) => {
          db.all('SELECT * FROM banners', (err5, banners) => {
            let sqlDump = `-- ========================================================\n`;
            sqlDump += `-- PASARIN INDONESIA - MASTER DATABASE DUMP LENGKAP\n`;
            sqlDump += `-- Berisi: Banner Hero, Akun Admin, Akun Pembeli, Seluruh Produk, Promo & Pesanan\n`;
            sqlDump += `-- Waktu Dibuat: ${new Date().toISOString()}\n`;
            sqlDump += `-- ========================================================\n\n`;

            sqlDump += `CREATE DATABASE IF NOT EXISTS \`pasarin_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
            sqlDump += `USE \`pasarin_db\`;\n\n`;

            // DDL & INSERTS: Banners
            sqlDump += `-- 1. TABEL BANNERS\n`;
            sqlDump += `CREATE TABLE IF NOT EXISTS \`banners\` (\n`;
            sqlDump += `  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,\n`;
            sqlDump += `  \`config_json\` LONGTEXT NOT NULL,\n`;
            sqlDump += `  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n`;
            sqlDump += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

            if (banners && banners.length > 0) {
              for (const b of banners) {
                const escaped = b.config_json.replace(/'/g, "\\'");
                sqlDump += `INSERT INTO \`banners\` (\`id\`, \`config_json\`) VALUES ('${b.id}', '${escaped}') ON DUPLICATE KEY UPDATE \`config_json\`=VALUES(\`config_json\`);\n`;
              }
              sqlDump += `\n`;
            }

            // DDL & INSERTS: Users
            sqlDump += `-- 2. TABEL USERS (AKUN ADMIN & AKUN PEMBELI)\n`;
            sqlDump += `CREATE TABLE IF NOT EXISTS \`users\` (\n`;
            sqlDump += `  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,\n`;
            sqlDump += `  \`name\` VARCHAR(150) NOT NULL,\n`;
            sqlDump += `  \`email\` VARCHAR(150) NOT NULL UNIQUE,\n`;
            sqlDump += `  \`phone\` VARCHAR(50) DEFAULT NULL,\n`;
            sqlDump += `  \`role\` VARCHAR(50) DEFAULT 'buyer',\n`;
            sqlDump += `  \`salt\` VARCHAR(255) NOT NULL,\n`;
            sqlDump += `  \`hash\` VARCHAR(255) NOT NULL,\n`;
            sqlDump += `  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
            sqlDump += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

            if (users && users.length > 0) {
              for (const u of users) {
                const name = (u.name || '').replace(/'/g, "\\'");
                const email = (u.email || '').replace(/'/g, "\\'");
                const phone = u.phone ? `'${u.phone}'` : 'NULL';
                sqlDump += `INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`phone\`, \`role\`, \`salt\`, \`hash\`) VALUES ('${u.id}', '${name}', '${email}', ${phone}, '${u.role}', '${u.salt}', '${u.hash}') ON DUPLICATE KEY UPDATE \`role\`=VALUES(\`role\`);\n`;
              }
              sqlDump += `\n`;
            }

            // DDL & INSERTS: Products
            sqlDump += `-- 3. TABEL PRODUCTS (SELURUH PRODUK LENGKAP DENGAN 168PART SHOPEE)\n`;
            sqlDump += `CREATE TABLE IF NOT EXISTS \`products\` (\n`;
            sqlDump += `  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,\n`;
            sqlDump += `  \`name\` VARCHAR(255) NOT NULL,\n`;
            sqlDump += `  \`slug\` VARCHAR(255) NOT NULL,\n`;
            sqlDump += `  \`category\` VARCHAR(100) NOT NULL,\n`;
            sqlDump += `  \`price\` DECIMAL(14,2) NOT NULL,\n`;
            sqlDump += `  \`original_price\` DECIMAL(14,2) DEFAULT NULL,\n`;
            sqlDump += `  \`discount_percent\` INT DEFAULT 0,\n`;
            sqlDump += `  \`rating\` DECIMAL(2,1) DEFAULT 5.0,\n`;
            sqlDump += `  \`sold_count\` INT DEFAULT 0,\n`;
            sqlDump += `  \`stock\` INT DEFAULT 10,\n`;
            sqlDump += `  \`location\` VARCHAR(100) DEFAULT 'Indonesia',\n`;
            sqlDump += `  \`shop_name\` VARCHAR(150) DEFAULT 'Pasarin Partner',\n`;
            sqlDump += `  \`shop_type\` VARCHAR(50) DEFAULT 'Star',\n`;
            sqlDump += `  \`icon\` VARCHAR(50) DEFAULT 'bag',\n`;
            sqlDump += `  \`image\` TEXT DEFAULT NULL,\n`;
            sqlDump += `  \`bg_pattern\` VARCHAR(50) DEFAULT '#f8fafc',\n`;
            sqlDump += `  \`is_flash_sale\` TINYINT(1) DEFAULT 0,\n`;
            sqlDump += `  \`flash_sale_sold\` INT DEFAULT 0,\n`;
            sqlDump += `  \`description\` TEXT DEFAULT NULL,\n`;
            sqlDump += `  \`specs\` JSON DEFAULT NULL,\n`;
            sqlDump += `  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
            sqlDump += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

            if (products && products.length > 0) {
              for (const p of products) {
                const name = (p.name || '').replace(/'/g, "\\'");
                const desc = (p.description || '').replace(/'/g, "\\'");
                const specs = (p.specs || '[]').replace(/'/g, "\\'");
                const shopName = (p.shop_name || '').replace(/'/g, "\\'");
                sqlDump += `INSERT INTO \`products\` (\`id\`, \`name\`, \`slug\`, \`category\`, \`price\`, \`original_price\`, \`discount_percent\`, \`rating\`, \`sold_count\`, \`stock\`, \`location\`, \`shop_name\`, \`shop_type\`, \`icon\`, \`image\`, \`bg_pattern\`, \`is_flash_sale\`, \`flash_sale_sold\`, \`description\`, \`specs\`) VALUES ('${p.id}', '${name}', '${p.slug}', '${p.category}', ${p.price}, ${p.original_price || 'NULL'}, ${p.discount_percent || 0}, ${p.rating || 5.0}, ${p.sold_count || 0}, ${p.stock || 10}, '${p.location || 'Indonesia'}', '${shopName}', '${p.shop_type || 'Star'}', '${p.icon || 'bag'}', '${p.image || ''}', '${p.bg_pattern || '#f8fafc'}', ${p.is_flash_sale || 0}, ${p.flash_sale_sold || 0}, '${desc}', '${specs}') ON DUPLICATE KEY UPDATE \`price\`=VALUES(\`price\`);\n`;
              }
              sqlDump += `\n`;
            }

            // DDL & INSERTS: Promos
            sqlDump += `-- 4. TABEL PROMOS (VOUCHER & KODE PROMO)\n`;
            sqlDump += `CREATE TABLE IF NOT EXISTS \`promos\` (\n`;
            sqlDump += `  \`code\` VARCHAR(64) NOT NULL PRIMARY KEY,\n`;
            sqlDump += `  \`title\` VARCHAR(255) NOT NULL,\n`;
            sqlDump += `  \`description\` TEXT DEFAULT NULL,\n`;
            sqlDump += `  \`discount_type\` VARCHAR(32) NOT NULL,\n`;
            sqlDump += `  \`discount_value\` DECIMAL(14,2) NOT NULL,\n`;
            sqlDump += `  \`min_spend\` DECIMAL(14,2) DEFAULT 0,\n`;
            sqlDump += `  \`max_discount\` DECIMAL(14,2) DEFAULT NULL,\n`;
            sqlDump += `  \`quota\` INT DEFAULT 100,\n`;
            sqlDump += `  \`used_count\` INT DEFAULT 0,\n`;
            sqlDump += `  \`category\` VARCHAR(50) DEFAULT 'diskon',\n`;
            sqlDump += `  \`is_active\` TINYINT(1) DEFAULT 1,\n`;
            sqlDump += `  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
            sqlDump += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

            if (promos && promos.length > 0) {
              for (const pr of promos) {
                const title = (pr.title || '').replace(/'/g, "\\'");
                const desc = (pr.description || '').replace(/'/g, "\\'");
                sqlDump += `INSERT INTO \`promos\` (\`code\`, \`title\`, \`description\`, \`discount_type\`, \`discount_value\`, \`min_spend\`, \`max_discount\`, \`quota\`, \`used_count\`, \`category\`, \`is_active\`) VALUES ('${pr.code}', '${title}', '${desc}', '${pr.discount_type}', ${pr.discount_value}, ${pr.min_spend || 0}, ${pr.max_discount || 'NULL'}, ${pr.quota || 100}, ${pr.used_count || 0}, '${pr.category || 'diskon'}', ${pr.is_active || 1}) ON DUPLICATE KEY UPDATE \`is_active\`=VALUES(\`is_active\`);\n`;
              }
              sqlDump += `\n`;
            }

            // DDL & INSERTS: Orders
            sqlDump += `-- 5. TABEL ORDERS (RIWAYAT TRANSAKSI PESANAN)\n`;
            sqlDump += `CREATE TABLE IF NOT EXISTS \`orders\` (\n`;
            sqlDump += `  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,\n`;
            sqlDump += `  \`user_id\` VARCHAR(64) NOT NULL,\n`;
            sqlDump += `  \`items\` JSON NOT NULL,\n`;
            sqlDump += `  \`shipping_address\` TEXT NOT NULL,\n`;
            sqlDump += `  \`payment_method\` VARCHAR(100) NOT NULL,\n`;
            sqlDump += `  \`notes\` TEXT DEFAULT NULL,\n`;
            sqlDump += `  \`total_amount\` DECIMAL(14,2) NOT NULL,\n`;
            sqlDump += `  \`status\` VARCHAR(50) DEFAULT 'Sedang Diproses',\n`;
            sqlDump += `  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
            sqlDump += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

            if (orders && orders.length > 0) {
              for (const o of orders) {
                const items = (o.items || '[]').replace(/'/g, "\\'");
                const addr = (o.shipping_address || '').replace(/'/g, "\\'");
                sqlDump += `INSERT INTO \`orders\` (\`id\`, \`user_id\`, \`items\`, \`shipping_address\`, \`payment_method\`, \`notes\`, \`total_amount\`, \`status\`) VALUES ('${o.id}', '${o.user_id}', '${items}', '${addr}', '${o.payment_method}', ${o.notes ? `'${o.notes.replace(/'/g, "\\'")}'` : 'NULL'}, ${o.total_amount}, '${o.status}') ON DUPLICATE KEY UPDATE \`status\`=VALUES(\`status\`);\n`;
              }
              sqlDump += `\n`;
            }

            fs.writeFileSync(sqlDumpPath, sqlDump, 'utf8');
            console.log('✅ File SQL Dump Master berhasil digenerate di:', sqlDumpPath);
            db.close();
          });
        });
      });
    });
  });
});

