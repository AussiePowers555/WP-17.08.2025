const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkCases() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(`
      SELECT case_number, is_deleted, created_at, workspace_id 
      FROM cases 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('Recent cases in database:');
    console.log('=' .repeat(60));
    
    result.rows.forEach(c => {
      console.log(`Case ${c.case_number}:`);
      console.log(`  Deleted: ${c.is_deleted || false}`);
      console.log(`  Workspace: ${c.workspace_id || 'MAIN'}`);
      console.log(`  Created: ${c.created_at}`);
      console.log('');
    });
    
    // Count total active cases
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM cases WHERE is_deleted = false OR is_deleted IS NULL'
    );
    console.log(`Total active cases: ${countResult.rows[0].total}`);
    
    // Count deleted cases
    const deletedResult = await pool.query(
      'SELECT COUNT(*) as total FROM cases WHERE is_deleted = true'
    );
    console.log(`Total deleted cases: ${deletedResult.rows[0].total}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCases();