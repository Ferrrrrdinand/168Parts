'use strict';
const { seedProducts } = require('../../data/seedProducts');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    if (seedProducts && seedProducts.length > 0) {
      const prodsToInsert = seedProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug || p.id,
        category: p.category || 'Sparepart HP',
        price: p.price || 0,
        original_price: p.original_price || null,
        discount_percent: p.discount_percent || 0,
        rating: p.rating || 5.0,
        sold_count: p.sold_count || 0,
        stock: p.stock || 25,
        location: p.location || 'Kota Surabaya',
        shop_name: p.shop_name || '168 Parts Surabaya',
        shop_type: p.shop_type || 'Star+',
        icon: p.icon || 'phone',
        image: p.image || 'images/product-placeholder.svg',
        bg_pattern: p.bg_pattern || '#f8fafc',
        is_flash_sale: p.is_flash_sale ? true : false,
        flash_sale_sold: p.flash_sale_sold || 0,
        description: p.description || '',
        created_at: now,
        updated_at: now
      }));
      await queryInterface.bulkInsert('products', prodsToInsert, { ignoreDuplicates: true });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  }
};
