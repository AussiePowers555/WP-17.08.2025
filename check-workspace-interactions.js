const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Check interactions table
    const result = await pool.query(`
      SELECT 
        i.id,
        i.case_number,
        i.workspace_id as interaction_workspace,
        c.workspace_id as case_workspace,
        i.situation
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE c.workspace_id = '550e8400-e29b-41d4-a716-446655440101'
      ORDER BY i.timestamp DESC
    `);
    
    console.log('Interactions for workspace 550e8400-e29b-41d4-a716-446655440101:', result.rows.length);
    console.log('Sample interactions:', result.rows.slice(0, 3));
    
    // Check all interactions
    const allResult = await pool.query(`
      SELECT 
        i.id,
        i.case_number,
        i.workspace_id as interaction_workspace,
        c.workspace_id as case_workspace
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
    `);
    
    console.log('\nTotal interactions in database:', allResult.rows.length);
    console.log('All interactions:', allResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();