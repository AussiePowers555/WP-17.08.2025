const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkCases() {
  try {
    // Check cases with workspace_id
    const result = await pool.query(`
      SELECT 
        case_number,
        client_name,
        workspace_id,
        status
      FROM cases
      WHERE workspace_id = '550e8400-e29b-41d4-a716-446655440101'
      ORDER BY case_number
    `);
    
    console.log('Cases in David workspace:', result.rows);
    
    // Check all cases to see their workspace assignments
    const allCases = await pool.query(`
      SELECT 
        case_number,
        client_name,
        workspace_id,
        status
      FROM cases
      ORDER BY case_number
      LIMIT 10
    `);
    
    console.log('\nAll cases (first 10):');
    allCases.rows.forEach(c => {
      console.log(`- ${c.case_number}: ${c.client_name} | workspace: ${c.workspace_id || 'NONE'}`);
    });
    
    // Check interactions with their case workspace
    const interactions = await pool.query(`
      SELECT 
        i.id,
        i.case_number,
        c.workspace_id,
        c.client_name
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      LIMIT 10
    `);
    
    console.log('\nInteractions with case workspace:');
    interactions.rows.forEach(i => {
      console.log(`- Interaction ${i.id} for case ${i.case_number}: workspace ${i.workspace_id || 'NONE'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCases();