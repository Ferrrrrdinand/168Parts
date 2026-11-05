const path = require('path');
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'pasarin-marketplace-super-secret-key-2026',
  dataPath: path.join(__dirname, '../../data/db.json'),
  staticFrontendPath: path.join(__dirname, '../../../frontend'),
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    databaseUrl: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || ''
  }
};


