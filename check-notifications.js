const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkNotifications() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Check for notification tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%notif%' OR table_name LIKE '%bell%' OR table_name LIKE '%alert%')
    `);
    
    console.log('Found tables:', result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkNotifications();