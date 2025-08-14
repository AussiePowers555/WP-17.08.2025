const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Check auth_users table
    const authResult = await pool.query(`
      SELECT id, email, role, workspace_id, display_name
      FROM auth_users
      WHERE email = 'michaelalanwilson2016@icloud.com'
    `);
    
    console.log('User michaelalanwilson2016@icloud.com in auth_users:');
    console.log(authResult.rows[0]);
    
    const userId = authResult.rows[0]?.id;
    const workspaceId = authResult.rows[0]?.workspace_id;
    
    // Check workspace_users for this user
    if (userId) {
      const workspaceUserResult = await pool.query(`
        SELECT * FROM workspace_users
        WHERE user_id = $1
      `, [userId]);
      
      console.log('\nUser in workspace_users:');
      console.log(workspaceUserResult.rows);
    }
    
    // Check workspace details
    if (workspaceId) {
      const workspaceResult = await pool.query(`
        SELECT * FROM workspaces WHERE id = $1
      `, [workspaceId]);
      
      console.log('\nWorkspace from auth_users.workspace_id:');
      console.log(workspaceResult.rows[0]);
      
      // Check cases in this workspace
      const casesResult = await pool.query(`
        SELECT id, case_number, workspace_id 
        FROM cases 
        WHERE workspace_id = $1
      `, [workspaceId]);
      
      console.log('\nCases in workspace', workspaceId, ':');
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
      `, [workspaceId]);
      
      console.log('\nInteractions for cases in workspace', workspaceId, ':');
      console.log('Total count:', interactionsResult.rows.length);
      console.log('Interactions:', interactionsResult.rows);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();