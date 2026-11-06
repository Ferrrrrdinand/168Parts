'use strict';
const path = require('path');
const fs = require('fs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonPath = path.resolve(__dirname, '../../data/db.json');
    if (!fs.existsSync(jsonPath)) return;
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const now = new Date();

    // 1. Seed Users
    if (data.users && data.users.length > 0) {
      const usersToInsert = data.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || null,
        role: u.role || 'buyer',
        salt: u.salt,
        hash: u.hash,
        created_at: u.createdAt ? new Date(u.createdAt) : now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('users', usersToInsert, { ignoreDuplicates: true });
    }

    // 2. Seed Products
    if (data.products && data.products.length > 0) {
      const prodsToInsert = data.products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug || p.id,
        category: p.category || 'Elektronik',
        price: p.price || 0,
        original_price: p.originalPrice || null,
        discount_percent: p.discountPercent || 0,
        rating: p.rating || 5.0,
        sold_count: p.soldCount || 0,
        stock: p.stock || 10,
        location: p.location || 'Indonesia',
        shop_name: p.shopName || 'Pasarin Store',
        shop_type: p.shopType || 'Star',
        icon: p.icon || 'bag',
        image: p.image || null,
        bg_pattern: p.bgPattern || '#f8fafc',
        is_flash_sale: p.isFlashSale ? 1 : 0,
        flash_sale_sold: p.flashSaleSold || 0,
        description: p.description || '',
        specs: JSON.stringify(p.specs || []),
        created_at: now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('products', prodsToInsert, { ignoreDuplicates: true });
    }

    // 3. Seed Promos
    if (data.promos && data.promos.length > 0) {
      const promosToInsert = data.promos.map(pr => ({
        code: pr.code,
        title: pr.title,
        description: pr.description || '',
        discount_type: pr.discount_type || pr.discountType || 'diskon',
        discount_value: pr.discount_value !== undefined ? pr.discount_value : (pr.discountValue || 0),
        min_spend: pr.min_spend !== undefined ? pr.min_spend : (pr.minSpend || 0),
        max_discount: pr.max_discount !== undefined ? pr.max_discount : (pr.maxDiscount || null),
        quota: pr.quota || 100,
        used_count: pr.used_count || pr.usedCount || 0,
        category: pr.category || 'diskon',
        is_active: pr.is_active !== undefined ? pr.is_active : (pr.isActive !== undefined ? (pr.isActive ? 1 : 0) : 1),
        created_at: now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('promos', promosToInsert, { ignoreDuplicates: true });
    }

    // 4. Seed Banners
    if (data.banners) {
      await queryInterface.bulkInsert('banners', [{
        id: 'main_banner',
        config_json: JSON.stringify(data.banners),
        created_at: now,
        updated_at: now
      }], { ignoreDuplicates: true });
    }

    // 5. Seed Orders
    if (data.orders && data.orders.length > 0) {
      const ordersToInsert = data.orders.map(o => ({
        id: o.id,
        user_id: o.userId || o.user_id,
        items: typeof o.items === 'string' ? o.items : JSON.stringify(o.items || []),
        shipping_address: typeof o.shippingAddress === 'string' ? o.shippingAddress : JSON.stringify(o.shippingAddress || ''),
        payment_method: o.paymentMethod || o.payment_method || 'COD',
        notes: o.notes || null,
        total_amount: o.totalAmount || o.total_amount || 0,
        status: o.status || 'Sedang Diproses',
        created_at: o.createdAt ? new Date(o.createdAt) : now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('orders', ordersToInsert, { ignoreDuplicates: true });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('banners', null, {});
    await queryInterface.bulkDelete('orders', null, {});
    await queryInterface.bulkDelete('promos', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};

