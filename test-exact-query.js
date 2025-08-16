const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testExactQuery() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Testing the exact query from getInteractions...');
    
    const workspaceId = '571ab2ed-e9b0-42f4-a09c-2e74c2af7e6d';
    
    // This is the exact query from getInteractions in src/lib/actions/interactions.ts
    const query = `
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
      WHERE (c.is_deleted = false OR c.is_deleted IS NULL)
      AND c.workspace_id = $1
      ORDER BY i.timestamp DESC
      LIMIT 21 OFFSET 0
    `;
    
    console.log('\n📋 Query with case workspace filter:');
    const result1 = await pool.query(query, [workspaceId]);
    console.log(`Results: ${result1.rows.length}`);
    
    if (result1.rows.length > 0) {
      result1.rows.slice(0, 3).forEach((row, idx) => {
        console.log(`${idx + 1}. ID: ${row.id} | Case: ${row.caseNumber} | Contact: ${row.contactName} | IWS: ${row.workspaceId}`);
      });
    }
    
    // Test with interaction workspace filter instead
    console.log('\n🔄 Testing with interaction workspace filter:');
    const query2 = `
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
      WHERE (c.is_deleted = false OR c.is_deleted IS NULL)
      AND i.workspace_id = $1
      ORDER BY i.timestamp DESC
      LIMIT 21 OFFSET 0
    `;
    
    const result2 = await pool.query(query2, [workspaceId]);
    console.log(`Results: ${result2.rows.length}`);
    
    if (result2.rows.length > 0) {
      result2.rows.slice(0, 5).forEach((row, idx) => {
        console.log(`${idx + 1}. ID: ${row.id} | Case: ${row.caseNumber} | Contact: ${row.contactName} | IWS: ${row.workspaceId}`);
      });
    }
    
    // Check interactions with no matching cases
    console.log('\n🔍 Checking interactions without matching cases:');
    const query3 = `
      SELECT 
        i.id, i.case_number, i.workspace_id, i.case_id,
        c.id as case_exists
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE i.workspace_id = $1 AND c.id IS NULL
    `;
    
    const result3 = await pool.query(query3, [workspaceId]);
    console.log(`Interactions without matching cases: ${result3.rows.length}`);
    result3.rows.forEach(row => {
      console.log(`  - ID: ${row.id} | Case: ${row.case_number} | Case ID: ${row.case_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testExactQuery();