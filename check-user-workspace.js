const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Check user workspace assignment
    const userResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.workspace_id,
        w.name as workspace_name
      FROM workspace_users u
      LEFT JOIN workspaces w ON u.workspace_id = w.id
      WHERE u.email = 'michaelalanwilson2016@icloud.com'
    `);
    
    console.log('User michaelalanwilson2016@icloud.com:');
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