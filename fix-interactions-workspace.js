const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixInteractionsWorkspace() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Fixing interactions workspace assignments...');
    
    // First, let's see what we have
    const currentState = await pool.query(`
      SELECT 
        i.id, i.case_number, i.workspace_id as interaction_workspace,
        c.workspace_id as case_workspace
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      ORDER BY i.id
    `);
    
    console.log('📊 Current state:');
    currentState.rows.forEach(row => {
      console.log(`  ID: ${row.id} | Case: ${row.case_number} | Int Workspace: ${row.interaction_workspace} | Case Workspace: ${row.case_workspace}`);
    });
    
    // Update interactions to match their case's workspace
    console.log('\n🔄 Updating interactions to match case workspaces...');
    
    const updateResult = await pool.query(`
      UPDATE interactions 
      SET workspace_id = c.workspace_id::text
      FROM cases c 
      WHERE interactions.case_id = c.id 
      AND (interactions.workspace_id IS NULL OR interactions.workspace_id != c.workspace_id::text)
      RETURNING interactions.id, interactions.case_number, interactions.workspace_id as new_workspace
    `);
    
    console.log(`✅ Updated ${updateResult.rows.length} interactions:`);
    updateResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id} | Case: ${row.case_number} | New Workspace: ${row.new_workspace}`);
    });
    
    // For interactions without cases, assign them to a default workspace
    console.log('\n🏢 Handling interactions without cases...');
    
    const orphanResult = await pool.query(`
      UPDATE interactions 
      SET workspace_id = '571ab2ed-e9b0-42f4-a09c-2e74c2af7e6d'
      WHERE case_id IS NULL AND workspace_id IS NULL
      RETURNING id, case_number, workspace_id
    `);
    
    if (orphanResult.rows.length > 0) {
      console.log(`✅ Assigned ${orphanResult.rows.length} orphan interactions to workspace 571ab2ed...:`);
      orphanResult.rows.forEach(row => {
        console.log(`  - ID: ${row.id} | Case: ${row.case_number}`);
      });
    } else {
      console.log('ℹ️ No orphan interactions found');
    }
    
    // Final verification
    console.log('\n📈 Final workspace distribution:');
    const finalDistribution = await pool.query(`
      SELECT workspace_id, COUNT(*) as count 
      FROM interactions 
      GROUP BY workspace_id 
      ORDER BY count DESC
    `);
    
    finalDistribution.rows.forEach(ws => {
      console.log(`  - Workspace ${ws.workspace_id || 'null'}: ${ws.count} interactions`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixInteractionsWorkspace();