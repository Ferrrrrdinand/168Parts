require('dotenv').config();

const pgConfig = {
  dialect: 'postgres',
  use_env_variable: 'DATABASE_URL',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false
};

module.exports = {
  development: pgConfig,
  test: pgConfig,
  production: pgConfig
};

