const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDavidCases() {
  try {
    const davidWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
    
    console.log('=== DAVID WORKSPACE ANALYSIS ===\n');
    console.log(`David Workspace ID: ${davidWorkspaceId}\n`);
    
    // 1. Check the workspace itself
    const workspaceResult = await pool.query(`
      SELECT id, name, contact_id, type
      FROM workspaces
      WHERE id = $1
    `, [davidWorkspaceId]);
    
    console.log('Workspace Details:');
    console.log(workspaceResult.rows[0]);
    console.log('\n');
    
    // 2. Check cases assigned to David workspace
    const casesResult = await pool.query(`
      SELECT 
        case_number,
        client_name,
        status,
        workspace_id,
        lawyer,
        rental_company,
        created_at
      FROM cases
      WHERE workspace_id = $1
      ORDER BY created_at DESC
    `, [davidWorkspaceId]);
    
    console.log(`Cases in David Workspace: ${casesResult.rows.length} cases\n`);
    casesResult.rows.forEach((c, i) => {
      console.log(`${i + 1}. Case: ${c.case_number}`);
      console.log(`   Client: ${c.client_name}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Lawyer: ${c.lawyer || 'Not assigned'}`);
      console.log(`   Rental: ${c.rental_company || 'Not assigned'}`);
      console.log(`   Created: ${c.created_at}`);
      console.log('');
    });
    
    // 3. Check interactions for these cases
    console.log('\n=== INTERACTIONS FOR DAVID\'S CASES ===\n');
    
    for (const caseRow of casesResult.rows) {
      const interactionsResult = await pool.query(`
        SELECT 
          i.id,
          i.case_number,
          i.interaction_type,
          i.contact_name,
          i.timestamp
        FROM interactions i
        WHERE i.case_number = $1
        ORDER BY i.timestamp DESC
      `, [caseRow.case_number]);
      
      console.log(`Case ${caseRow.case_number}: ${interactionsResult.rows.length} interactions`);
      if (interactionsResult.rows.length > 0) {
        interactionsResult.rows.forEach(i => {
          console.log(`  - ${i.interaction_type}: ${i.contact_name || 'No contact'} (${new Date(i.timestamp).toLocaleDateString()})`);
        });
      }
      console.log('');
    }
    
    // 4. Check users in David workspace
    console.log('\n=== USERS IN DAVID WORKSPACE ===\n');
    
    const usersResult = await pool.query(`
      SELECT 
        wu.user_id,
        wu.role,
        wu.display_name,
        u.email,
        u.role as user_role
      FROM workspace_users wu
      JOIN user_accounts u ON wu.user_id = u.id
      WHERE wu.workspace_id = $1 AND wu.is_active = true
    `, [davidWorkspaceId]);
    
    console.log(`Users: ${usersResult.rows.length}`);
    usersResult.rows.forEach(u => {
      console.log(`- ${u.display_name || u.email}: ${u.role} (User role: ${u.user_role})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDavidCases();