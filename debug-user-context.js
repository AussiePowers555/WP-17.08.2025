const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function debugUserContext() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Debugging user context for michaelalanwilson@outlook.com...');
    
    const userEmail = 'michaelalanwilson@outlook.com';
    
    // Get user details
    const userQuery = `
      SELECT id, email, role, status, workspace_id, first_login, created_at
      FROM user_accounts 
      WHERE email = $1
    `;
    
    const userResult = await pool.query(userQuery, [userEmail]);
    console.log('\n👤 User account details:');
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Status: ${user.status}`);
      console.log(`  - Workspace ID: ${user.workspace_id}`);
      console.log(`  - First Login: ${user.first_login}`);
      console.log(`  - Created: ${user.created_at}`);
    } else {
      console.log('  ❌ User not found!');
      return;
    }
    
    const user = userResult.rows[0];
    const userWorkspaceId = user.workspace_id;
    
    // Check workspace assignment
    const workspaceAssignmentQuery = `
      SELECT wu.workspace_id, wu.role, wu.is_active, w.name as workspace_name
      FROM workspace_users wu
      LEFT JOIN workspaces w ON wu.workspace_id = w.id
      WHERE wu.user_id = $1
    `;
    
    const assignmentResult = await pool.query(workspaceAssignmentQuery, [user.id]);
    console.log('\n🏢 Workspace assignments:');
    assignmentResult.rows.forEach(assignment => {
      console.log(`  - Workspace: ${assignment.workspace_id} (${assignment.workspace_name})`);
      console.log(`  - Role: ${assignment.role}`);
      console.log(`  - Active: ${assignment.is_active}`);
    });
    
    // Test the exact query that would be run for interactions
    console.log('\n🔍 Testing interactions query for this user...');
    
    // Test with user's workspace_id
    if (userWorkspaceId) {
      console.log(`\nQuerying with user workspace_id: ${userWorkspaceId}`);
      
      const interactionsQuery = `
        SELECT 
          i.id, i.case_number, i.interaction_type, i.contact_name, 
          i.timestamp, i.workspace_id as interaction_workspace
        FROM interactions i
        LEFT JOIN cases c ON i.case_id = c.id
        WHERE (c.is_deleted = false OR c.is_deleted IS NULL)
        AND i.workspace_id = $1
        ORDER BY i.timestamp DESC
        LIMIT 10
      `;
      
      const interactionsResult = await pool.query(interactionsQuery, [userWorkspaceId]);
      console.log(`Results: ${interactionsResult.rows.length} interactions`);
      
      interactionsResult.rows.forEach((int, idx) => {
        console.log(`${idx + 1}. Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Workspace: ${int.interaction_workspace}`);
      });
    }
    
    // Test with workspace assignments
    for (const assignment of assignmentResult.rows) {
      console.log(`\nQuerying with assigned workspace: ${assignment.workspace_id}`);
      
      const interactionsQuery = `
        SELECT 
          i.id, i.case_number, i.interaction_type, i.contact_name, 
          i.timestamp, i.workspace_id as interaction_workspace
        FROM interactions i
        LEFT JOIN cases c ON i.case_id = c.id
        WHERE (c.is_deleted = false OR c.is_deleted IS NULL)
        AND i.workspace_id = $1
        ORDER BY i.timestamp DESC
        LIMIT 10
      `;
      
      const interactionsResult = await pool.query(interactionsQuery, [assignment.workspace_id]);
      console.log(`Results: ${interactionsResult.rows.length} interactions`);
      
      interactionsResult.rows.forEach((int, idx) => {
        console.log(`${idx + 1}. Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Workspace: ${int.interaction_workspace}`);
      });
    }
    
    // Check what workspace context the app might be using
    console.log('\n🎯 Expected workspace for this user:');
    console.log(`  - User workspace_id: ${userWorkspaceId}`);
    console.log(`  - User role: ${user.role}`);
    console.log(`  - Should filter by: ${userWorkspaceId}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugUserContext();