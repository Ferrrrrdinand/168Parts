require('dotenv').config();
const path = require('path');

const sqliteStoragePath = path.resolve(__dirname, '../../../backend/data/pasarin_local.db');

module.exports = {
  development: {
    dialect: process.env.DB_TYPE === 'mysql' ? 'mysql' : (process.env.DB_TYPE === 'postgres' ? 'postgres' : 'sqlite'),
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
  production: {
    dialect: process.env.DB_TYPE === 'mysql' ? 'mysql' : (process.env.DB_TYPE === 'postgres' ? 'postgres' : 'sqlite'),
    storage: process.env.SQLITE_FILE || sqliteStoragePath,
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pasarin_db',
    logging: false
  }
};

