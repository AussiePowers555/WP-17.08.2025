const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Check user details
    const userResult = await pool.query(`
      SELECT * FROM user_accounts
      WHERE email = 'michaelalanwilson2016@outlook.com'
    `);
    
    console.log('User michaelalanwilson2016@outlook.com:');
    console.log('- Role:', userResult.rows[0]?.role);
    console.log('- Workspace ID:', userResult.rows[0]?.workspace_id);
    
    const workspaceId = userResult.rows[0]?.workspace_id;
    
    if (workspaceId) {
      // Check workspace details
      const workspaceResult = await pool.query(`
        SELECT * FROM workspaces WHERE id = $1
      `, [workspaceId]);
      
      console.log('\nWorkspace details:');
      console.log('- Name:', workspaceResult.rows[0]?.name);
      console.log('- ID:', workspaceResult.rows[0]?.id);
      
      // Check cases in this workspace
      const casesResult = await pool.query(`
        SELECT id, case_number, workspace_id 
        FROM cases 
        WHERE workspace_id = $1
      `, [workspaceId]);
      
      console.log('\nCases in workspace', workspaceId, ':');
      console.log('Total cases:', casesResult.rows.length);
      casesResult.rows.forEach(c => console.log('- Case:', c.case_number));
      
      // Check interactions for this workspace
      const interactionsResult = await pool.query(`
        SELECT 
          i.id,
          i.case_number,
          c.workspace_id as case_workspace
        FROM interactions i
        LEFT JOIN cases c ON i.case_id = c.id
        WHERE c.workspace_id = $1
        ORDER BY i.timestamp DESC
      `, [workspaceId]);
      
      console.log('\nInteractions for workspace', workspaceId, ':');
      console.log('Total interactions:', interactionsResult.rows.length);
      interactionsResult.rows.forEach(i => console.log('- Interaction for case:', i.case_number));
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();