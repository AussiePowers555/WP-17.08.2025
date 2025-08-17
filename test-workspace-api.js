const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testWorkspaceAPI() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🧪 Testing workspace API functionality...');
    
    const daveWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
    
    // Simulate what DatabaseService.getWorkspaceById() does
    console.log('\n1️⃣ Testing DatabaseService.getWorkspaceById logic...');
    const query = 'SELECT * FROM workspaces WHERE id = $1';
    const result = await pool.query(query, [daveWorkspaceId]);
    
    if (result.rows.length > 0) {
      const workspace = result.rows[0];
      console.log('✅ Workspace found:');
      console.log(`  - ID: ${workspace.id}`);
      console.log(`  - Name: "${workspace.name}"`);
      console.log(`  - Type: ${workspace.type}`);
      
      // This is what should be returned by the API
      console.log('\n📡 Expected API response:');
      console.log(JSON.stringify(workspace, null, 2));
      
      // Test what the WorkspaceContext should do
      console.log('\n🎯 WorkspaceContext should:');
      console.log(`  - Set workspaceName to: "${workspace.name}"`);
      console.log(`  - Set contactType to: "${workspace.type || 'undefined'}"`);
      console.log(`  - Display name should be: "Client: ${workspace.name} Workspace"`);
      
    } else {
      console.log('❌ No workspace found');
    }
    
    // Check if user michaelalanwilson@outlook.com should have access
    console.log('\n2️⃣ Checking user access permissions...');
    const userQuery = `
      SELECT email, role, workspace_id, contact_id
      FROM user_accounts
      WHERE email = 'michaelalanwilson@outlook.com'
    `;
    
    const userResult = await pool.query(userQuery);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('👤 User details:');
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Workspace ID: ${user.workspace_id}`);
      console.log(`  - Contact ID: ${user.contact_id}`);
      
      const hasAccess = user.workspace_id === daveWorkspaceId;
      console.log(`\n🔐 API Access Check:`);
      console.log(`  - User workspace: ${user.workspace_id}`);
      console.log(`  - Target workspace: ${daveWorkspaceId}`);
      console.log(`  - Should have access: ${hasAccess ? '✅ YES' : '❌ NO'}`);
      
      if (hasAccess) {
        console.log('\n✅ The API should return workspace data for this user');
      } else {
        console.log('\n❌ The API should deny access for this user');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testWorkspaceAPI();