const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAllInteractions() {
  console.log('📊 All Interactions by Workspace\n');
  console.log('=' .repeat(70));
  
  try {
    const result = await pool.query(`
      SELECT 
        i.id,
        i.case_number,
        i.interaction_type,
        i.situation,
        i.workspace_id,
        w.name as workspace_name
      FROM interactions i
      LEFT JOIN workspaces w ON i.workspace_id::text = w.id::text
      ORDER BY i.workspace_id, i.case_number
    `);
    
    const byWorkspace = {};
    
    result.rows.forEach(i => {
      const ws = i.workspace_name || i.workspace_id || 'NO WORKSPACE';
      if (!byWorkspace[ws]) {
        byWorkspace[ws] = {
          id: i.workspace_id,
          interactions: []
        };
      }
      byWorkspace[ws].interactions.push({
        case_number: i.case_number,
        type: i.interaction_type,
        situation: i.situation.substring(0, 50)
      });
    });
    
    Object.keys(byWorkspace).forEach(ws => {
      console.log(`\n📁 ${ws}`);
      console.log(`   Workspace ID: ${byWorkspace[ws].id || 'None'}`);
      console.log(`   Total Interactions: ${byWorkspace[ws].interactions.length}`);
      console.log('   Interactions:');
      byWorkspace[ws].interactions.forEach(i => {
        console.log(`     - Case ${i.case_number}: ${i.type} - ${i.situation}...`);
      });
    });
    
    console.log('\n' + '=' .repeat(70));
    console.log('🔐 SECURITY CHECK:');
    console.log('   michaelalanwilson2016@outlook.com should ONLY see interactions from:');
    console.log('   "Rental Company: James Test Name Workspace" (ID: 571ab2ed-e9b0-42f4-a09c-2e74c2af7e6d)');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllInteractions();