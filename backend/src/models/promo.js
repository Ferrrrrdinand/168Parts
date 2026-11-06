module.exports = (sequelize, DataTypes) => {
  const Promo = sequelize.define('Promo', {
    code: {
      type: DataTypes.STRING(64),
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discountType: {
      type: DataTypes.STRING(32),
      allowNull: false,
      field: 'discount_type'
    },
    discountValue: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      field: 'discount_value'
    },
    minSpend: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      field: 'min_spend'
    },
    maxDiscount: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      field: 'max_discount'
    },
    quota: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    usedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'used_count'
    },
    category: {
      type: DataTypes.STRING(50),
      defaultValue: 'diskon'
    },
    isActive: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'is_active'
    }
  }, {
    tableName: 'promos',
    timestamps: true,
    underscored: true
  });

  return Promo;
};

