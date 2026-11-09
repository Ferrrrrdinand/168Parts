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
  logging: false
};

module.exports = {
  development: pgConfig,
  test: pgConfig,
  production: pgConfig
};

