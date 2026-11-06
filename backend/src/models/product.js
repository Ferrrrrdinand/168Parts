module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    price: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    originalPrice: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      field: 'original_price'
    },
    discountPercent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'discount_percent'
    },
    rating: {
      type: DataTypes.DOUBLE,
      defaultValue: 5.0
    },
    soldCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sold_count'
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    location: {
      type: DataTypes.STRING(100),
      defaultValue: 'Indonesia'
    },
    shopName: {
      type: DataTypes.STRING(150),
      defaultValue: 'Pasarin Partner',
      field: 'shop_name'
    },
    shopType: {
      type: DataTypes.STRING(50),
      defaultValue: 'Star',
      field: 'shop_type'
    },
    icon: {
      type: DataTypes.STRING(50),
      defaultValue: 'bag'
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bgPattern: {
      type: DataTypes.STRING(50),
      defaultValue: '#f8fafc',
      field: 'bg_pattern'
    },
    isFlashSale: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'is_flash_sale'
    },
    flashSaleSold: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'flash_sale_sold'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    specs: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('specs');
        if (!raw) return [];
        try {
          return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
          return [];
        }
      },
      set(val) {
        this.setDataValue('specs', typeof val === 'object' ? JSON.stringify(val) : val);
      }
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true
  });

  return Product;
};

