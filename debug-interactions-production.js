const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function debugInteractionsProduction() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Debugging interactions for production...');
    
    // Test the exact query from getInteractions
    console.log('\n📋 Testing main interactions query...');
    
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
      ORDER BY i.timestamp DESC
      LIMIT 21 OFFSET 0
    `;
    
    const result = await pool.query(query);
    console.log(`✅ Query successful: ${result.rows.length} results`);
    
    if (result.rows.length > 0) {
      console.log('\n📊 Sample results:');
      result.rows.slice(0, 3).forEach((row, idx) => {
        console.log(`${idx + 1}. ID: ${row.id} | Case: ${row.caseNumber} | Type: ${row.interactionType} | Workspace: ${row.workspaceId}`);
        console.log(`   Contact: ${row.contactName} | Situation: ${row.situation?.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ No results found');
    }
    
    // Test workspace filtering
    console.log('\n🏢 Testing workspace-specific queries...');
    
    // Test for MAIN workspace (should show all)
    const mainQuery = `
      SELECT COUNT(*) as count
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE (c.is_deleted = false OR c.is_deleted IS NULL)
    `;
    
    const mainResult = await pool.query(mainQuery);
    console.log(`📊 MAIN workspace (no filter): ${mainResult.rows[0].count} interactions`);
    
    // Test for specific workspace
    const workspaceQuery = `
      SELECT COUNT(*) as count
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE (c.is_deleted = false OR c.is_deleted IS NULL)
      AND c.workspace_id = $1
    `;
    
    const ws1Result = await pool.query(workspaceQuery, ['550e8400-e29b-41d4-a716-446655440101']);
    console.log(`📊 Workspace 550e8400...: ${ws1Result.rows[0].count} interactions`);
    
    const ws2Result = await pool.query(workspaceQuery, ['571ab2ed-e9b0-42f4-a09c-2e74c2af7e6d']);
    console.log(`📊 Workspace 571ab2ed...: ${ws2Result.rows[0].count} interactions`);
    
    // Check for interactions without case links
    const orphanQuery = `
      SELECT COUNT(*) as count
      FROM interactions i
      WHERE i.case_id IS NULL
    `;
    
    const orphanResult = await pool.query(orphanQuery);
    console.log(`🔗 Interactions without cases: ${orphanResult.rows[0].count}`);
    
    // Check authentication patterns
    console.log('\n👤 Authentication debugging...');
    
    // Check user accounts
    const usersQuery = `
      SELECT id, email, role, workspace_id 
      FROM user_accounts 
      WHERE email LIKE '%whitepointer%' OR email LIKE '%michael%'
      ORDER BY email
    `;
    
    const usersResult = await pool.query(usersQuery);
    console.log('📧 User accounts:');
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.email} | Role: ${user.role} | Workspace: ${user.workspace_id || 'null'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugInteractionsProduction();