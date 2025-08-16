const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDaveWorkspaceUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking users for Dave\'s workspace...');
    
    // First, identify Dave's workspace
    const workspacesQuery = `
      SELECT id, name, description, created_by
      FROM workspaces 
      WHERE name ILIKE '%dave%' OR description ILIKE '%dave%' OR created_by ILIKE '%dave%'
      ORDER BY created_at DESC
    `;
    
    const workspacesResult = await pool.query(workspacesQuery);
    console.log('🏢 Workspaces related to Dave:');
    workspacesResult.rows.forEach(ws => {
      console.log(`  - ID: ${ws.id} | Name: ${ws.name} | Description: ${ws.description} | Created by: ${ws.created_by}`);
    });
    
    // Check the main workspace we've been working with
    const mainWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
    console.log(`\n👤 Users in workspace ${mainWorkspaceId}:`);
    
    const usersQuery = `
      SELECT 
        ua.id, ua.email, ua.role, ua.status, ua.workspace_id,
        wu.workspace_id as workspace_assignment,
        wu.role as workspace_role,
        wu.is_active
      FROM user_accounts ua
      LEFT JOIN workspace_users wu ON ua.id = wu.user_id
      WHERE ua.workspace_id = $1 OR wu.workspace_id = $1
      ORDER BY ua.email
    `;
    
    const usersResult = await pool.query(usersQuery, [mainWorkspaceId]);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.email} | Role: ${user.role} | Status: ${user.status} | WS Role: ${user.workspace_role || 'none'} | Active: ${user.is_active || 'N/A'}`);
    });
    
    // Check all users with 'dave' in their email or name
    console.log('\n📧 All users with "dave" in email:');
    const daveUsersQuery = `
      SELECT id, email, role, status, workspace_id, first_login, created_at
      FROM user_accounts 
      WHERE email ILIKE '%dave%'
      ORDER BY created_at DESC
    `;
    
    const daveUsersResult = await pool.query(daveUsersQuery);
    daveUsersResult.rows.forEach(user => {
      console.log(`  - ${user.email} | Role: ${user.role} | Status: ${user.status} | Workspace: ${user.workspace_id} | First Login: ${user.first_login} | Created: ${user.created_at}`);
    });
    
    // Check workspace users table for any Dave assignments
    console.log('\n🔗 Workspace user assignments for Dave:');
    const workspaceAssignmentsQuery = `
      SELECT 
        wu.workspace_id, wu.user_id, wu.role, wu.is_active,
        ua.email, w.name as workspace_name
      FROM workspace_users wu
      JOIN user_accounts ua ON wu.user_id = ua.id
      LEFT JOIN workspaces w ON wu.workspace_id = w.id
      WHERE ua.email ILIKE '%dave%'
      ORDER BY wu.created_at DESC
    `;
    
    const assignmentsResult = await pool.query(workspaceAssignmentsQuery);
    assignmentsResult.rows.forEach(assignment => {
      console.log(`  - ${assignment.email} assigned to workspace ${assignment.workspace_id} (${assignment.workspace_name}) as ${assignment.role} | Active: ${assignment.is_active}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkDaveWorkspaceUsers();