const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixMock004Workspace() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Fixing MOCK-004 interaction workspace assignment...');
    
    const correctWorkspaceId = '550e8400-e29b-41d4-a716-446655440101'; // Dave's workspace
    const wrongWorkspaceId = '571ab2ed-e9b0-42f4-a09c-2e74c2af7e6d';
    
    // First, check the current state
    const checkQuery = `
      SELECT id, case_number, workspace_id, interaction_type, contact_name
      FROM interactions 
      WHERE case_number = 'MOCK-004'
    `;
    
    const checkResult = await pool.query(checkQuery);
    console.log('\n📋 Current MOCK-004 interaction state:');
    checkResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id} | Workspace: ${row.workspace_id} | Type: ${row.interaction_type} | Contact: ${row.contact_name}`);
    });
    
    // Update the workspace_id for MOCK-004 interactions
    const updateQuery = `
      UPDATE interactions 
      SET workspace_id = $1
      WHERE case_number = 'MOCK-004' AND workspace_id = $2
      RETURNING id, case_number, workspace_id, interaction_type, contact_name
    `;
    
    const updateResult = await pool.query(updateQuery, [correctWorkspaceId, wrongWorkspaceId]);
    
    console.log('\n✅ Updated interactions:');
    updateResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id} | New Workspace: ${row.workspace_id} | Type: ${row.interaction_type} | Contact: ${row.contact_name}`);
    });
    
    // Verify the fix
    const verifyQuery = `
      SELECT 
        i.id, i.case_number, i.workspace_id as interaction_workspace,
        c.workspace_id as case_workspace, i.interaction_type, i.contact_name
      FROM interactions i
      LEFT JOIN cases c ON i.case_number = c.case_number
      WHERE i.case_number = 'MOCK-004'
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    console.log('\n🔍 Verification - Workspace alignment:');
    verifyResult.rows.forEach(row => {
      const aligned = row.interaction_workspace === row.case_workspace;
      console.log(`  - ID: ${row.id} | Case WS: ${row.case_workspace} | Int WS: ${row.interaction_workspace} | Aligned: ${aligned ? '✅' : '❌'}`);
    });
    
    console.log('\n🎯 MOCK-004 interaction workspace fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixMock004Workspace();