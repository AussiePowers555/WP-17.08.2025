const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDaveWorkspaceCases() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking cases assigned to Dave\'s workspace...');
    
    const daveWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
    
    // Get all cases assigned to Dave's workspace
    const casesQuery = `
      SELECT 
        id, case_number, client_name, status, 
        accident_date, created_at, is_deleted,
        client_insurance_company, lawyer, rental_company,
        workspace_id
      FROM cases 
      WHERE workspace_id = $1
      ORDER BY created_at DESC
    `;
    
    const casesResult = await pool.query(casesQuery, [daveWorkspaceId]);
    
    console.log(`\n📋 Cases in Dave's workspace (${daveWorkspaceId}):`);
    console.log(`Total: ${casesResult.rows.length} cases`);
    
    casesResult.rows.forEach((case_row, idx) => {
      console.log(`\n${idx + 1}. Case: ${case_row.case_number}`);
      console.log(`   Client: ${case_row.client_name}`);
      console.log(`   Status: ${case_row.status}`);
      console.log(`   Accident Date: ${case_row.accident_date}`);
      console.log(`   Insurance: ${case_row.client_insurance_company || 'N/A'}`);
      console.log(`   Lawyer: ${case_row.lawyer || 'N/A'}`);
      console.log(`   Rental Company: ${case_row.rental_company || 'N/A'}`);
      console.log(`   Created: ${case_row.created_at}`);
      console.log(`   Deleted: ${case_row.is_deleted}`);
    });
    
    // Check interactions for these cases
    console.log(`\n💬 Interactions for Dave's workspace cases:`);
    const interactionsQuery = `
      SELECT 
        i.id, i.case_number, i.interaction_type, i.contact_name, 
        i.timestamp, i.workspace_id as interaction_workspace
      FROM interactions i
      WHERE i.workspace_id = $1
      ORDER BY i.timestamp DESC
      LIMIT 10
    `;
    
    const interactionsResult = await pool.query(interactionsQuery, [daveWorkspaceId]);
    console.log(`Total interactions: ${interactionsResult.rows.length}`);
    
    interactionsResult.rows.forEach((int, idx) => {
      console.log(`${idx + 1}. Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | ${int.timestamp}`);
    });
    
    // Summary by status
    console.log(`\n📊 Case status summary for Dave's workspace:`);
    const statusQuery = `
      SELECT status, COUNT(*) as count, 
             COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_count
      FROM cases 
      WHERE workspace_id = $1
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const statusResult = await pool.query(statusQuery, [daveWorkspaceId]);
    statusResult.rows.forEach(status => {
      console.log(`  - ${status.status}: ${status.count} total (${status.active_count} active)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkDaveWorkspaceCases();