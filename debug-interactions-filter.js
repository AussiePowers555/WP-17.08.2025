const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function debugInteractionsFilter() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Debugging interactions filter logic...');
    
    const workspaceId = '550e8400-e29b-41d4-a716-446655440101';
    
    // First, check all interactions for this workspace (no case filter)
    console.log('\n1️⃣ All interactions for workspace (no case filter):');
    const allInteractionsQuery = `
      SELECT 
        i.id, i.case_number, i.interaction_type, i.contact_name, 
        i.timestamp, i.workspace_id, i.case_id
      FROM interactions i
      WHERE i.workspace_id = $1
      ORDER BY i.timestamp DESC
    `;
    
    const allResult = await pool.query(allInteractionsQuery, [workspaceId]);
    console.log(`Results: ${allResult.rows.length} interactions`);
    
    allResult.rows.forEach((int, idx) => {
      console.log(`${idx + 1}. Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Case ID: ${int.case_id}`);
    });
    
    // Now check with case join and deleted filter (current query)
    console.log('\n2️⃣ With case join and deleted filter (current production query):');
    const currentQuery = `
      SELECT 
        i.id, i.case_number, i.interaction_type, i.contact_name, 
        i.timestamp, i.workspace_id, i.case_id,
        c.is_deleted as case_deleted
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE (c.is_deleted = false OR c.is_deleted IS NULL)
      AND i.workspace_id = $1
      ORDER BY i.timestamp DESC
    `;
    
    const currentResult = await pool.query(currentQuery, [workspaceId]);
    console.log(`Results: ${currentResult.rows.length} interactions`);
    
    currentResult.rows.forEach((int, idx) => {
      console.log(`${idx + 1}. Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Case Deleted: ${int.case_deleted}`);
    });
    
    // Check what cases exist for these interactions
    console.log('\n3️⃣ Case details for all interactions in workspace:');
    const caseDetailsQuery = `
      SELECT DISTINCT
        i.case_number, i.case_id,
        c.id as case_exists, c.is_deleted, c.client_name
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE i.workspace_id = $1
      ORDER BY i.case_number
    `;
    
    const caseDetailsResult = await pool.query(caseDetailsQuery, [workspaceId]);
    console.log(`Case details:`);
    
    caseDetailsResult.rows.forEach(case_row => {
      console.log(`  - Case: ${case_row.case_number} | Case ID: ${case_row.case_id}`);
      console.log(`    Case exists: ${case_row.case_exists ? 'Yes' : 'No'} | Deleted: ${case_row.is_deleted} | Client: ${case_row.client_name || 'N/A'}`);
    });
    
    // Test without the deleted filter to see all interactions
    console.log('\n4️⃣ All interactions with case join (no deleted filter):');
    const noDeletedFilterQuery = `
      SELECT 
        i.id, i.case_number, i.interaction_type, i.contact_name, 
        i.timestamp, i.workspace_id, i.case_id,
        c.is_deleted as case_deleted, c.client_name
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE i.workspace_id = $1
      ORDER BY i.timestamp DESC
    `;
    
    const noDeletedResult = await pool.query(noDeletedFilterQuery, [workspaceId]);
    console.log(`Results: ${noDeletedResult.rows.length} interactions`);
    
    noDeletedResult.rows.forEach((int, idx) => {
      console.log(`${idx + 1}. Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Case Deleted: ${int.case_deleted} | Client: ${int.client_name || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugInteractionsFilter();