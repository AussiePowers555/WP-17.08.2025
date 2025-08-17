const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkClientCaseAssignment() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking what interactions the client should see...');
    
    const userEmail = 'michaelalanwilson@outlook.com';
    const daveWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
    
    // Check user details
    const userQuery = `
      SELECT id, email, role, workspace_id, contact_id
      FROM user_accounts 
      WHERE email = $1
    `;
    
    const userResult = await pool.query(userQuery, [userEmail]);
    const user = userResult.rows[0];
    
    console.log('\n👤 User details:');
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Workspace ID: ${user.workspace_id}`);
    console.log(`  - Contact ID: ${user.contact_id}`);
    
    // Check ALL cases in Dave's workspace
    console.log('\n📋 ALL cases in Dave\'s workspace:');
    const allCasesQuery = `
      SELECT case_number, client_name, is_deleted, status, created_at
      FROM cases 
      WHERE workspace_id = $1
      ORDER BY is_deleted, case_number
    `;
    
    const allCasesResult = await pool.query(allCasesQuery, [daveWorkspaceId]);
    allCasesResult.rows.forEach(case_row => {
      console.log(`  - ${case_row.case_number} | ${case_row.client_name} | Deleted: ${case_row.is_deleted} | Status: ${case_row.status}`);
    });
    
    // Check ACTIVE cases only
    console.log('\n✅ ACTIVE cases in Dave\'s workspace:');
    const activeCasesQuery = `
      SELECT case_number, client_name, status, created_at
      FROM cases 
      WHERE workspace_id = $1 AND is_deleted = false
      ORDER BY case_number
    `;
    
    const activeCasesResult = await pool.query(activeCasesQuery, [daveWorkspaceId]);
    activeCasesResult.rows.forEach(case_row => {
      console.log(`  - ${case_row.case_number} | ${case_row.client_name} | Status: ${case_row.status}`);
    });
    
    // Check interactions for ACTIVE cases only
    console.log('\n💬 Interactions for ACTIVE cases only:');
    const activeInteractionsQuery = `
      SELECT 
        i.id, i.case_number, i.interaction_type, i.contact_name, 
        i.timestamp, c.is_deleted as case_deleted
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE i.workspace_id = $1 AND c.is_deleted = false
      ORDER BY i.timestamp DESC
    `;
    
    const activeInteractionsResult = await pool.query(activeInteractionsQuery, [daveWorkspaceId]);
    console.log(`Active case interactions: ${activeInteractionsResult.rows.length}`);
    
    activeInteractionsResult.rows.forEach((int, idx) => {
      console.log(`${idx + 1}. Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Case Deleted: ${int.case_deleted}`);
    });
    
    // Check if client users should be filtered by contact assignment
    console.log('\n🎯 Current logic analysis:');
    console.log('  - User sees: 8 interactions (for all cases in workspace)');
    console.log('  - You expect: 1 interaction');
    console.log('  - Active cases: ' + activeCasesResult.rows.length);
    console.log('  - Active case interactions: ' + activeInteractionsResult.rows.length);
    
    if (activeCasesResult.rows.length === 1 && activeInteractionsResult.rows.length === 0) {
      console.log('  ❌ The only active case (MOCK-004) has NO interactions');
      console.log('  ✅ Solution: Client should only see interactions for ACTIVE cases');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkClientCaseAssignment();