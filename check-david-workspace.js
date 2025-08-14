const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDavidWorkspace() {
  try {
    // Get David's workspace
    const workspaceResult = await pool.query(
      `SELECT id, name FROM workspaces WHERE name LIKE '%David%'`
    );
    
    if (workspaceResult.rows.length === 0) {
      console.log('No workspace found for David');
      return;
    }
    
    const workspace = workspaceResult.rows[0];
    console.log('David\'s Workspace:');
    console.log(`  ID: ${workspace.id}`);
    console.log(`  Name: ${workspace.name}`);
    console.log('');
    
    // Get cases in David's workspace
    const casesResult = await pool.query(
      `SELECT case_number, client_name, status, created_at 
       FROM cases 
       WHERE workspace_id = $1 
       AND (is_deleted = false OR is_deleted IS NULL)
       ORDER BY case_number`,
      [workspace.id]
    );
    
    console.log(`Cases assigned to David's workspace (${casesResult.rows.length} total):`);
    casesResult.rows.forEach(c => {
      console.log(`  - ${c.case_number}: ${c.client_name} (${c.status})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDavidWorkspace();