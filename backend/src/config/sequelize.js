require('dotenv').config();
const path = require('path');

const isSupabaseOrPg = process.env.DB_TYPE === 'supabase' || process.env.DB_TYPE === 'postgres' || Boolean(process.env.DATABASE_URL);

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

const sqliteStoragePath = path.resolve(__dirname, '../../../backend/data/pasarin_local.db');

module.exports = {
  development: isSupabaseOrPg ? pgConfig : {
    dialect: process.env.DB_TYPE === 'mysql' ? 'mysql' : 'sqlite',
    storage: process.env.SQLITE_FILE || sqliteStoragePath,
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pasarin_db',
    logging: false
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: isSupabaseOrPg ? pgConfig : {
    dialect: process.env.DB_TYPE === 'mysql' ? 'mysql' : 'sqlite',
    storage: process.env.SQLITE_FILE || sqliteStoragePath,
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pasarin_db',
    logging: false
  }
};

