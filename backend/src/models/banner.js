module.exports = (sequelize, DataTypes) => {
  const Banner = sequelize.define('Banner', {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      defaultValue: 'main_banner'
    },
    configJson: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'config_json',
      get() {
        const raw = this.getDataValue('configJson');
        if (!raw) return null;
        try {
          return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
          return null;
        }
      },
      set(val) {
        this.setDataValue('configJson', typeof val === 'object' ? JSON.stringify(val) : val);
      }
    }
  }, {
    tableName: 'banners',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at',
    underscored: true
  });

  return Banner;
};

