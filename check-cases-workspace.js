const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkCasesWorkspace() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking cases workspace assignments...');
    
    // Check cases that interactions reference
    const casesQuery = `
      SELECT DISTINCT c.id, c.case_number, c.workspace_id, c.client_name
      FROM cases c
      INNER JOIN interactions i ON i.case_id = c.id OR i.case_number = c.case_number
      ORDER BY c.case_number
    `;
    
    const casesResult = await pool.query(casesQuery);
    console.log('📋 Cases referenced by interactions:');
    casesResult.rows.forEach(case_row => {
      console.log(`  - ${case_row.case_number} | ID: ${case_row.id} | Workspace: ${case_row.workspace_id} | Client: ${case_row.client_name}`);
    });
    
    // Check all workspace assignments
    const workspaceQuery = `
      SELECT workspace_id, COUNT(*) as count 
      FROM cases 
      GROUP BY workspace_id 
      ORDER BY count DESC
    `;
    
    const workspaceResult = await pool.query(workspaceQuery);
    console.log('\n🏢 Cases by workspace:');
    workspaceResult.rows.forEach(ws => {
      console.log(`  - Workspace ${ws.workspace_id || 'null'}: ${ws.count} cases`);
    });
    
    // Get specific cases for the interactions that are in MAIN
    const mainInteractionsQuery = `
      SELECT i.case_number, i.workspace_id as int_workspace
      FROM interactions i
      WHERE i.workspace_id = 'MAIN'
      GROUP BY i.case_number, i.workspace_id
    `;
    
    const mainResult = await pool.query(mainInteractionsQuery);
    console.log('\n📊 Interactions in MAIN workspace:');
    mainResult.rows.forEach(row => {
      console.log(`  - Case: ${row.case_number}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkCasesWorkspace();