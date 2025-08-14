const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // First check table columns
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'workspace_users'
    `);
    
    console.log('workspace_users table columns:');
    console.log(columnsResult.rows.map(r => r.column_name));
    
    // Check user workspace assignment
    const userResult = await pool.query(`
      SELECT * FROM workspace_users
      WHERE user_email = 'michaelalanwilson2016@icloud.com'
    `);
    
    console.log('\nUser michaelalanwilson2016@icloud.com in workspace_users:');
    console.log(userResult.rows[0]);
    
    // Check workspace details
    if (userResult.rows[0]?.workspace_id) {
      const workspaceResult = await pool.query(`
        SELECT * FROM workspaces WHERE id = $1
      `, [userResult.rows[0].workspace_id]);
      
      console.log('\nWorkspace details:');
      console.log(workspaceResult.rows[0]);
      
      // Check cases in this workspace
      const casesResult = await pool.query(`
        SELECT id, case_number, workspace_id 
        FROM cases 
        WHERE workspace_id = $1
      `, [userResult.rows[0].workspace_id]);
      
      console.log('\nCases in this workspace:');
      console.log(casesResult.rows);
      
      // Check interactions for cases in this workspace
      const interactionsResult = await pool.query(`
        SELECT 
          i.id,
          i.case_number,
          i.workspace_id as interaction_workspace,
          c.workspace_id as case_workspace
        FROM interactions i
        LEFT JOIN cases c ON i.case_id = c.id
        WHERE c.workspace_id = $1
      `, [userResult.rows[0].workspace_id]);
      
      console.log('\nInteractions for cases in this workspace:');
      console.log('Total count:', interactionsResult.rows.length);
      console.log('Interactions:', interactionsResult.rows);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();