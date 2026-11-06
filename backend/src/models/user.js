module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'buyer'
    },
    salt: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true
  });

  return User;
};

