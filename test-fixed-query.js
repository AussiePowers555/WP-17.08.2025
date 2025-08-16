const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testFixedQuery() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🧪 Testing fixed interactions query...');
    
    const workspaceId = '550e8400-e29b-41d4-a716-446655440101';
    
    // Test the NEW query (without deleted case filter)
    const newQuery = `
      SELECT 
        i.id,
        i.case_number as "caseNumber",
        i.case_id as "caseId",
        i.interaction_type as "interactionType",
        i.timestamp,
        i.contact_name as "contactName",
        i.contact_phone as "contactPhone",
        i.contact_email as "contactEmail",
        i.situation,
        i.action_taken as "actionTaken",
        i.outcome,
        i.priority,
        i.status,
        i.tags,
        i.attachments,
        i.created_by as "createdBy",
        i.updated_by as "updatedBy",
        i.created_at as "createdAt",
        i.updated_at as "updatedAt",
        i.workspace_id as "workspaceId",
        c.client_name as "caseHirerName",
        c.accident_date as "incidentDate",
        c.status as "caseStatus",
        c.client_insurance_company as "insuranceCompany",
        c.lawyer as "lawyerAssigned",
        c.rental_company as "rentalCompany",
        i.created_by as "createdByName",
        i.created_by as "createdByEmail"
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE 1=1
      AND i.workspace_id = $1
      ORDER BY i.timestamp DESC
      LIMIT 21 OFFSET 0
    `;
    
    const result = await pool.query(newQuery, [workspaceId]);
    
    console.log(`✅ NEW QUERY RESULTS: ${result.rows.length} interactions found!`);
    
    if (result.rows.length > 0) {
      console.log('\n📊 Sample interactions:');
      result.rows.slice(0, 5).forEach((int, idx) => {
        console.log(`${idx + 1}. ID: ${int.id} | Case: ${int.caseNumber} | Type: ${int.interactionType} | Contact: ${int.contactName}`);
        console.log(`   Client: ${int.caseHirerName || 'N/A'} | Insurance: ${int.insuranceCompany || 'N/A'}`);
        console.log(`   Timestamp: ${int.timestamp}`);
      });
      
      console.log(`\n🎯 SUCCESS! michaelalanwilson@outlook.com will now see ${result.rows.length} interactions!`);
    } else {
      console.log('❌ Still no results - something else is wrong');
    }
    
    // Count by case
    console.log('\n📈 Interactions by case:');
    const countQuery = `
      SELECT i.case_number, COUNT(*) as count, c.client_name, c.is_deleted
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE i.workspace_id = $1
      GROUP BY i.case_number, c.client_name, c.is_deleted
      ORDER BY count DESC
    `;
    
    const countResult = await pool.query(countQuery, [workspaceId]);
    countResult.rows.forEach(row => {
      console.log(`  - ${row.case_number}: ${row.count} interactions | Client: ${row.client_name || 'N/A'} | Deleted: ${row.is_deleted}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testFixedQuery();