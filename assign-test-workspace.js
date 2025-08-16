const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function assignTestWorkspace() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Assigning test workspace to null workspace cases and interactions...');
    const testWorkspaceId = '571ab2ed-e9b0-42f4-a09c-2e74c2af7e6d';
    
    // First, update cases with null workspace to the test workspace
    console.log('\n📋 Updating cases with null workspace...');
    
    const casesUpdateResult = await pool.query(`
      UPDATE cases 
      SET workspace_id = $1
      WHERE workspace_id IS NULL
      RETURNING case_number, id, client_name
    `, [testWorkspaceId]);
    
    console.log(`✅ Updated ${casesUpdateResult.rows.length} cases:`);
    casesUpdateResult.rows.forEach(case_row => {
      console.log(`  - ${case_row.case_number} | Client: ${case_row.client_name}`);
    });
    
    // Update interactions with MAIN workspace to the test workspace
    console.log('\n📊 Updating interactions in MAIN workspace...');
    
    const interactionsMainResult = await pool.query(`
      UPDATE interactions 
      SET workspace_id = $1
      WHERE workspace_id = 'MAIN'
      RETURNING id, case_number, contact_name
    `, [testWorkspaceId]);
    
    console.log(`✅ Updated ${interactionsMainResult.rows.length} interactions from MAIN:`);
    interactionsMainResult.rows.forEach(int => {
      console.log(`  - ID: ${int.id} | Case: ${int.case_number} | Contact: ${int.contact_name}`);
    });
    
    // Update interactions with null workspace to the test workspace
    console.log('\n🔄 Updating interactions with null workspace...');
    
    const interactionsNullResult = await pool.query(`
      UPDATE interactions 
      SET workspace_id = $1
      WHERE workspace_id IS NULL
      RETURNING id, case_number, contact_name
    `, [testWorkspaceId]);
    
    console.log(`✅ Updated ${interactionsNullResult.rows.length} interactions from null:`);
    interactionsNullResult.rows.forEach(int => {
      console.log(`  - ID: ${int.id} | Case: ${int.case_number} | Contact: ${int.contact_name}`);
    });
    
    // Final verification
    console.log('\n📈 Final verification - interactions by workspace:');
    const finalVerification = await pool.query(`
      SELECT workspace_id, COUNT(*) as count 
      FROM interactions 
      GROUP BY workspace_id 
      ORDER BY count DESC
    `);
    
    finalVerification.rows.forEach(ws => {
      console.log(`  - Workspace ${ws.workspace_id}: ${ws.count} interactions`);
    });
    
    console.log('\n🎯 Test user workspace interactions:');
    const testWorkspaceInteractions = await pool.query(`
      SELECT 
        i.id, i.case_number, i.interaction_type, i.contact_name, i.timestamp
      FROM interactions i
      WHERE i.workspace_id = $1
      ORDER BY i.timestamp DESC
      LIMIT 5
    `, [testWorkspaceId]);
    
    testWorkspaceInteractions.rows.forEach(int => {
      console.log(`  - ID: ${int.id} | Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

assignTestWorkspace();