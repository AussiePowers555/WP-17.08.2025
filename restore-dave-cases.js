const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function restoreDaveCases() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Restoring deleted cases for Dave\'s workspace...');
    
    const workspaceId = '550e8400-e29b-41d4-a716-446655440101';
    
    // First, show current deleted cases
    const deletedCasesQuery = `
      SELECT id, case_number, client_name, is_deleted, created_at
      FROM cases 
      WHERE workspace_id = $1 AND is_deleted = true
      ORDER BY created_at DESC
    `;
    
    const deletedResult = await pool.query(deletedCasesQuery, [workspaceId]);
    console.log(`\n📋 Currently deleted cases in Dave's workspace:`);
    deletedResult.rows.forEach(case_row => {
      console.log(`  - ${case_row.case_number} | ${case_row.client_name} | Deleted: ${case_row.is_deleted}`);
    });
    
    // Restore the cases that have interactions
    const casesToRestore = ['MOCK-001', 'CASE-126170', 'CASE-105519'];
    
    console.log(`\n🔄 Restoring cases: ${casesToRestore.join(', ')}`);
    
    const restoreQuery = `
      UPDATE cases 
      SET is_deleted = false, updated_at = NOW()
      WHERE workspace_id = $1 AND case_number = ANY($2)
      RETURNING case_number, client_name, is_deleted
    `;
    
    const restoreResult = await pool.query(restoreQuery, [workspaceId, casesToRestore]);
    console.log(`✅ Restored ${restoreResult.rows.length} cases:`);
    restoreResult.rows.forEach(case_row => {
      console.log(`  - ${case_row.case_number} | ${case_row.client_name} | Deleted: ${case_row.is_deleted}`);
    });
    
    // Test the interactions query now
    console.log(`\n🧪 Testing interactions query after restore:`);
    const testQuery = `
      SELECT 
        i.id, i.case_number, i.interaction_type, i.contact_name, 
        i.timestamp, c.is_deleted as case_deleted
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE (c.is_deleted = false OR c.is_deleted IS NULL)
      AND i.workspace_id = $1
      ORDER BY i.timestamp DESC
      LIMIT 10
    `;
    
    const testResult = await pool.query(testQuery, [workspaceId]);
    console.log(`Results: ${testResult.rows.length} interactions`);
    
    testResult.rows.forEach((int, idx) => {
      console.log(`${idx + 1}. Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Case Deleted: ${int.case_deleted}`);
    });
    
    // Final summary
    console.log(`\n📊 Final status for Dave's workspace:`);
    const finalQuery = `
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_cases,
        COUNT(CASE WHEN is_deleted = true THEN 1 END) as deleted_cases
      FROM cases 
      WHERE workspace_id = $1
    `;
    
    const finalResult = await pool.query(finalQuery, [workspaceId]);
    const stats = finalResult.rows[0];
    console.log(`  - Total cases: ${stats.total_cases}`);
    console.log(`  - Active cases: ${stats.active_cases}`);
    console.log(`  - Deleted cases: ${stats.deleted_cases}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

restoreDaveCases();