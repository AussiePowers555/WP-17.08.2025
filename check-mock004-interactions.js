const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkMock004Interactions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking MOCK-004 case and its interactions...');
    
    // Check MOCK-004 case details
    const caseQuery = `
      SELECT id, case_number, client_name, workspace_id, is_deleted, status, created_at
      FROM cases 
      WHERE case_number = 'MOCK-004'
    `;
    
    const caseResult = await pool.query(caseQuery);
    console.log('\n📋 MOCK-004 Case Details:');
    if (caseResult.rows.length > 0) {
      const caseData = caseResult.rows[0];
      console.log(`  - Case ID: ${caseData.id}`);
      console.log(`  - Case Number: ${caseData.case_number}`);
      console.log(`  - Client: ${caseData.client_name}`);
      console.log(`  - Workspace ID: ${caseData.workspace_id}`);
      console.log(`  - Is Deleted: ${caseData.is_deleted}`);
      console.log(`  - Status: ${caseData.status}`);
      
      // Check interactions for MOCK-004 by case_id
      console.log('\n💬 Interactions for MOCK-004 (by case_id):');
      const intByIdQuery = `
        SELECT id, case_number, interaction_type, contact_name, timestamp, workspace_id, case_id
        FROM interactions 
        WHERE case_id = $1
        ORDER BY timestamp DESC
      `;
      
      const intByIdResult = await pool.query(intByIdQuery, [caseData.id]);
      console.log(`Found ${intByIdResult.rows.length} interactions by case_id`);
      intByIdResult.rows.forEach((int, idx) => {
        console.log(`${idx + 1}. ID: ${int.id} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Workspace: ${int.workspace_id}`);
      });
      
      // Check interactions for MOCK-004 by case_number
      console.log('\n💬 Interactions for MOCK-004 (by case_number):');
      const intByNumberQuery = `
        SELECT id, case_number, interaction_type, contact_name, timestamp, workspace_id, case_id
        FROM interactions 
        WHERE case_number = 'MOCK-004'
        ORDER BY timestamp DESC
      `;
      
      const intByNumberResult = await pool.query(intByNumberQuery);
      console.log(`Found ${intByNumberResult.rows.length} interactions by case_number`);
      intByNumberResult.rows.forEach((int, idx) => {
        console.log(`${idx + 1}. ID: ${int.id} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Workspace: ${int.workspace_id}`);
      });
      
      // Check ALL interactions in Dave's workspace
      console.log('\n📊 ALL interactions in Dave\'s workspace:');
      const allIntQuery = `
        SELECT DISTINCT case_number, COUNT(*) as count
        FROM interactions 
        WHERE workspace_id = $1
        GROUP BY case_number
        ORDER BY case_number
      `;
      
      const allIntResult = await pool.query(allIntQuery, [caseData.workspace_id]);
      allIntResult.rows.forEach(row => {
        console.log(`  - ${row.case_number}: ${row.count} interactions`);
      });
      
      // Check interaction sequence/tracking
      console.log('\n🔢 Interaction tracking analysis:');
      const trackingQuery = `
        SELECT 
          id as interaction_id,
          case_number,
          interaction_type,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY case_number ORDER BY created_at) as interaction_sequence
        FROM interactions 
        WHERE workspace_id = $1
        ORDER BY case_number, created_at
      `;
      
      const trackingResult = await pool.query(trackingQuery, [caseData.workspace_id]);
      console.log('Interaction sequence numbers:');
      trackingResult.rows.forEach(row => {
        console.log(`  - ${row.case_number} #${row.interaction_sequence}: ID ${row.interaction_id} | Type: ${row.interaction_type}`);
      });
      
    } else {
      console.log('❌ MOCK-004 case not found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkMock004Interactions();