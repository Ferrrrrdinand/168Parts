'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Users
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      role: {
        type: Sequelize.STRING(50),
        defaultValue: 'buyer'
      },
      salt: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // 2. Products
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      price: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      original_price: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      discount_percent: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rating: {
        type: Sequelize.DOUBLE,
        defaultValue: 5.0
      },
      sold_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      stock: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      location: {
        type: Sequelize.STRING(100),
        defaultValue: 'Indonesia'
      },
      shop_name: {
        type: Sequelize.STRING(150),
        defaultValue: 'Pasarin Partner'
      },
      shop_type: {
        type: Sequelize.STRING(50),
        defaultValue: 'Star'
      },
      icon: {
        type: Sequelize.STRING(50),
        defaultValue: 'bag'
      },
      image: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      bg_pattern: {
        type: Sequelize.STRING(50),
        defaultValue: '#f8fafc'
      },
      is_flash_sale: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      flash_sale_sold: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      specs: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // 3. Promos
    await queryInterface.createTable('promos', {
      code: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      discount_type: {
        type: Sequelize.STRING(32),
        allowNull: false
      },
      discount_value: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      min_spend: {
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      max_discount: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      quota: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      used_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      category: {
        type: Sequelize.STRING(50),
        defaultValue: 'diskon'
      },
      is_active: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // 4. Orders
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      items: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      shipping_address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      payment_method: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      total_amount: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'Sedang Diproses'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // 5. Banners
    await queryInterface.createTable('banners', {
      id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        defaultValue: 'main_banner'
      },
      config_json: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('banners');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('promos');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('users');
  }
};

