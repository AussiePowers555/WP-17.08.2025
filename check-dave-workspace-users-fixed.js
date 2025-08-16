const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDaveWorkspaceUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking users for Dave\'s workspace...');
    
    // First, check workspace table structure
    const workspaceStructure = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'workspaces'
      ORDER BY ordinal_position
    `);
    
    console.log('🏗️ Workspace table columns:', workspaceStructure.rows.map(r => r.column_name).join(', '));
    
    // Get all workspaces
    const workspacesQuery = `
      SELECT id, name, contact_id, type, created_at
      FROM workspaces 
      ORDER BY created_at DESC
    `;
    
    const workspacesResult = await pool.query(workspacesQuery);
    console.log('\n🏢 All workspaces:');
    workspacesResult.rows.forEach(ws => {
      console.log(`  - ID: ${ws.id} | Name: ${ws.name} | Contact ID: ${ws.contact_id} | Type: ${ws.type} | Created: ${ws.created_at}`);
    });
    
    // Check the main workspace we've been working with (David's workspace)
    const daveWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
    console.log(`\n👤 Users in Dave's workspace ${daveWorkspaceId}:`);
    
    const usersQuery = `
      SELECT 
        ua.id, ua.email, ua.role, ua.status, ua.workspace_id,
        ua.first_login, ua.created_at
      FROM user_accounts ua
      WHERE ua.workspace_id = $1
      ORDER BY ua.email
    `;
    
    const usersResult = await pool.query(usersQuery, [daveWorkspaceId]);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.email} | Role: ${user.role} | Status: ${user.status} | First Login: ${user.first_login} | Created: ${user.created_at}`);
    });
    
    // Check workspace_users table for assignments to Dave's workspace
    console.log(`\n🔗 Workspace user assignments for workspace ${daveWorkspaceId}:`);
    const workspaceAssignmentsQuery = `
      SELECT 
        wu.user_id, wu.role, wu.is_active, wu.created_at,
        ua.email
      FROM workspace_users wu
      JOIN user_accounts ua ON wu.user_id = ua.id
      WHERE wu.workspace_id = $1
      ORDER BY wu.created_at DESC
    `;
    
    const assignmentsResult = await pool.query(workspaceAssignmentsQuery, [daveWorkspaceId]);
    assignmentsResult.rows.forEach(assignment => {
      console.log(`  - ${assignment.email} | Role: ${assignment.role} | Active: ${assignment.is_active} | Assigned: ${assignment.created_at}`);
    });
    
    // Check all users with 'dave' in their email
    console.log('\n📧 All users with "dave" in email:');
    const daveUsersQuery = `
      SELECT id, email, role, status, workspace_id, first_login, created_at
      FROM user_accounts 
      WHERE email ILIKE '%dave%'
      ORDER BY created_at DESC
    `;
    
    const daveUsersResult = await pool.query(daveUsersQuery);
    daveUsersResult.rows.forEach(user => {
      console.log(`  - ${user.email} | Role: ${user.role} | Status: ${user.status} | Workspace: ${user.workspace_id} | First Login: ${user.first_login}`);
    });
    
    // Check for developer accounts
    console.log('\n👨‍💻 Developer accounts:');
    const devQuery = `
      SELECT email, role, workspace_id, status, created_at
      FROM user_accounts 
      WHERE role = 'developer'
      ORDER BY created_at DESC
    `;
    
    const devResult = await pool.query(devQuery);
    devResult.rows.forEach(dev => {
      console.log(`  - ${dev.email} | Role: ${dev.role} | Workspace: ${dev.workspace_id} | Status: ${dev.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkDaveWorkspaceUsers();