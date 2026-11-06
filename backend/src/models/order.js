module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'user_id'
    },
    items: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('items');
        if (!raw) return [];
        try {
          return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
          return [];
        }
      },
      set(val) {
        this.setDataValue('items', typeof val === 'object' ? JSON.stringify(val) : val);
      }
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'shipping_address'
    },
    paymentMethod: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'payment_method'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    totalAmount: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      field: 'total_amount'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'Sedang Diproses'
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: true
  });

  return Order;
};

