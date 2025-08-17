const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkWorkspaceName() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking Dave\'s workspace details...');
    
    const daveWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
    
    // First, check workspaces table structure
    const structureQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'workspaces'
      ORDER BY ordinal_position
    `;
    
    const structureResult = await pool.query(structureQuery);
    console.log('\n📋 Workspaces table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check workspace details
    const workspaceQuery = `
      SELECT *
      FROM workspaces
      WHERE id = $1
    `;
    
    const workspaceResult = await pool.query(workspaceQuery, [daveWorkspaceId]);
    
    if (workspaceResult.rows.length > 0) {
      const workspace = workspaceResult.rows[0];
      console.log('\n📋 Workspace details:');
      console.log('📋 Workspace data:');
      Object.keys(workspace).forEach(key => {
        console.log(`  - ${key}: ${workspace[key]}`);
      });
      
      // Test the API endpoint
      console.log('\n🌐 Testing API endpoint...');
      console.log(`Expected API call: GET /api/workspaces/${daveWorkspaceId}`);
      console.log(`Should return workspace data for API`);
      
    } else {
      console.log('❌ Workspace not found!');
      
      // Check all workspaces
      console.log('\n📋 All workspaces:');
      const allWorkspacesQuery = `
        SELECT *
        FROM workspaces
        ORDER BY created_at
      `;
      
      const allWorkspacesResult = await pool.query(allWorkspacesQuery);
      allWorkspacesResult.rows.forEach(ws => {
        console.log(`  - Workspace: ${JSON.stringify(ws)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkWorkspaceName();