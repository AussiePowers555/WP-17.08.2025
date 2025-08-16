const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function debugWorkspaceContext() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Debugging workspace context issue...');
    
    const userEmail = 'michaelalanwilson@outlook.com';
    
    // Get user details
    const userQuery = `
      SELECT id, email, role, status, workspace_id, first_login
      FROM user_accounts 
      WHERE email = $1
    `;
    
    const userResult = await pool.query(userQuery, [userEmail]);
    const user = userResult.rows[0];
    
    console.log('\n👤 User details:');
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - User workspace_id: ${user.workspace_id}`);
    console.log(`  - Status: ${user.status}`);
    
    // Check what workspace this user should see
    const userWorkspaceId = user.workspace_id;
    
    console.log('\n🏢 Expected workspace behavior:');
    if (user.role === 'client') {
      console.log(`  - Client users should see their assigned workspace: ${userWorkspaceId}`);
      console.log(`  - Should NOT see "Main Workspace"`);
      console.log(`  - Should see interactions for workspace: ${userWorkspaceId}`);
    }
    
    // Check cases in user's workspace
    const casesQuery = `
      SELECT case_number, client_name, workspace_id, is_deleted
      FROM cases 
      WHERE workspace_id = $1
      ORDER BY case_number
    `;
    
    const casesResult = await pool.query(casesQuery, [userWorkspaceId]);
    console.log(`\n📋 Cases in user's workspace (${userWorkspaceId}):`);
    casesResult.rows.forEach(case_row => {
      console.log(`  - ${case_row.case_number} | ${case_row.client_name} | Deleted: ${case_row.is_deleted}`);
    });
    
    // Check interactions in user's workspace
    const interactionsQuery = `
      SELECT 
        i.id, i.case_number, i.interaction_type, i.contact_name, 
        i.workspace_id
      FROM interactions i
      WHERE i.workspace_id = $1
      ORDER BY i.timestamp DESC
    `;
    
    const interactionsResult = await pool.query(interactionsQuery, [userWorkspaceId]);
    console.log(`\n💬 Interactions in user's workspace (${userWorkspaceId}):`);
    console.log(`Total: ${interactionsResult.rows.length} interactions`);
    
    interactionsResult.rows.forEach((int, idx) => {
      console.log(`${idx + 1}. Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Workspace: ${int.workspace_id}`);
    });
    
    // The problem: User is seeing "Main Workspace" but should see their specific workspace
    console.log('\n🚨 PROBLEM IDENTIFIED:');
    console.log('  - User has workspace_id:', userWorkspaceId);
    console.log('  - User should see Dave\'s workspace, not Main Workspace');
    console.log('  - Frontend is showing wrong workspace context');
    console.log('  - Need to fix workspace switching/context logic');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugWorkspaceContext();