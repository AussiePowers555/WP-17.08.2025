const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('=== michaelalanwilson@outlook.com DATA ===\n');
    
    // 1. Get user info
    const userResult = await pool.query(`
      SELECT id, email, role, workspace_id 
      FROM user_accounts 
      WHERE email = 'michaelalanwilson@outlook.com'
    `);
    
    const user = userResult.rows[0];
    console.log('1. USER INFO:');
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.role);
    console.log('   - Workspace ID:', user.workspace_id);
    
    // 2. Get workspace info
    const wsResult = await pool.query(`
      SELECT id, name 
      FROM workspaces 
      WHERE id = $1
    `, [user.workspace_id]);
    
    const workspace = wsResult.rows[0];
    console.log('\n2. ASSIGNED WORKSPACE:');
    console.log('   - Name:', workspace?.name || 'None');
    console.log('   - ID:', workspace?.id || 'None');
    
    // 3. Get cases in this workspace
    const casesResult = await pool.query(`
      SELECT id, case_number, client_name 
      FROM cases 
      WHERE workspace_id = $1 
      AND (is_deleted = false OR is_deleted IS NULL)
    `, [user.workspace_id]);
    
    console.log('\n3. CASES IN WORKSPACE:');
    console.log('   - Total cases:', casesResult.rows.length);
    casesResult.rows.forEach(c => {
      console.log(`   - Case ${c.case_number}: ${c.client_name}`);
    });
    
    // 4. Get interactions for these cases
    const interactionsResult = await pool.query(`
      SELECT 
        i.id,
        i.case_number,
        i.interaction_type,
        i.contact_name,
        i.situation,
        i.action_taken,
        i.outcome,
        i.timestamp
      FROM interactions i
      JOIN cases c ON i.case_id = c.id
      WHERE c.workspace_id = $1
      ORDER BY i.timestamp DESC
    `, [user.workspace_id]);
    
    console.log('\n4. INTERACTIONS TO VIEW:');
    console.log('   - Total interactions:', interactionsResult.rows.length);
    
    if (interactionsResult.rows.length > 0) {
      console.log('\n5. INTERACTION DETAILS:');
      interactionsResult.rows.forEach((i, index) => {
        console.log(`\n   Interaction #${index + 1}:`);
        console.log('   - Case Number:', i.case_number);
        console.log('   - Type:', i.interaction_type);
        console.log('   - Contact:', i.contact_name);
        console.log('   - Situation:', i.situation);
        console.log('   - Action:', i.action_taken);
        console.log('   - Outcome:', i.outcome);
        console.log('   - Date:', new Date(i.timestamp).toLocaleString());
      });
    } else {
      console.log('   No interactions to display');
    }
    
    console.log('\n=== SUMMARY FOR michaelalanwilson@outlook.com ===');
    console.log('- Workspace:', workspace?.name || 'None');
    console.log('- Cases:', casesResult.rows.length);
    console.log('- Interactions:', interactionsResult.rows.length);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();