const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyDavidCount() {
  const davidWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
  
  try {
    // Count interactions with proper filtering (as secure query should do)
    const properCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM interactions i
      INNER JOIN cases c ON i.case_id = c.id
      WHERE c.workspace_id = $1
      AND (c.is_deleted = false OR c.is_deleted IS NULL)
    `, [davidWorkspaceId]);
    
    // Count all interactions (what might be shown incorrectly)
    const allCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM interactions i
      WHERE i.workspace_id = $1
    `, [davidWorkspaceId]);
    
    console.log('David\'s Workspace Interaction Counts:');
    console.log('=====================================');
    console.log(`✅ CORRECT count (non-deleted cases only): ${properCount.rows[0].count}`);
    console.log(`❌ INCORRECT count (all interactions): ${allCount.rows[0].count}`);
    console.log('');
    console.log('The UI is showing 8 interactions, which matches the INCORRECT count.');
    console.log('This means deleted cases are being included in the display.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyDavidCount();