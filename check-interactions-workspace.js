const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkInteractions() {
  try {
    const davidWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
    
    // Check what the query should return
    const result = await pool.query(`
      SELECT 
        i.id,
        i.case_number as "caseNumber",
        i.case_id as "caseId",
        i.interaction_type as "interactionType",
        i.timestamp,
        i.contact_name as "contactName",
        c.client_name as "caseHirerName",
        c.workspace_id,
        c.client_insurance_company as "insuranceCompany",
        c.lawyer as "lawyerAssigned",
        c.rental_company as "rentalCompany"
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE c.workspace_id = $1
      ORDER BY i.timestamp DESC
      LIMIT 20
    `, [davidWorkspaceId]);
    
    console.log(`\nInteractions for David workspace (${davidWorkspaceId}):`);
    console.log(`Found ${result.rows.length} interactions\n`);
    
    result.rows.forEach(row => {
      console.log(`- ${row.caseNumber}: ${row.interactionType} | ${row.contactName || 'No contact'} | Case workspace: ${row.workspace_id}`);
    });
    
    // Now check ALL interactions to see what's being returned
    const allInteractions = await pool.query(`
      SELECT 
        i.id,
        i.case_number as "caseNumber",
        i.case_id as "caseId",
        c.workspace_id
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      ORDER BY i.timestamp DESC
    `);
    
    console.log(`\n\nAll interactions in database:`);
    allInteractions.rows.forEach(row => {
      console.log(`- ${row.caseNumber}: workspace ${row.workspace_id || 'NONE'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkInteractions();