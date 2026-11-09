const path = require('path');
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'pasarin-marketplace-super-secret-key-2026',
  staticFrontendPath: path.join(__dirname, '../../../frontend'),
  supabase: {
    url: process.env.SUPABASE_URL || 'https://vgraouxizjvfnpzfebyb.supabase.co',
    key: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres.vgraouxizjvfnpzfebyb:168parts2026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres'
  }
};


