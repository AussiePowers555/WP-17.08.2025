const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function investigateDavidInteractions() {
  const davidWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
  
  try {
    console.log('🔍 Investigating interactions in David\'s workspace\n');
    console.log('=' .repeat(70));
    
    // 1. Check all interactions in David's workspace
    const interactionsResult = await pool.query(
      `SELECT 
        i.id,
        i.case_number,
        i.case_id,
        i.interaction_type,
        i.situation,
        i.workspace_id,
        c.workspace_id as case_workspace_id,
        c.is_deleted as case_deleted
       FROM interactions i
       LEFT JOIN cases c ON i.case_id = c.id
       WHERE i.workspace_id = $1
       ORDER BY i.case_number`,
      [davidWorkspaceId]
    );
    
    console.log(`\nTotal interactions with David's workspace ID: ${interactionsResult.rows.length}`);
    
    // Group by case number
    const byCaseNumber = {};
    interactionsResult.rows.forEach(i => {
      if (!byCaseNumber[i.case_number]) {
        byCaseNumber[i.case_number] = [];
      }
      byCaseNumber[i.case_number].push(i);
    });
    
    console.log('\nInteractions grouped by case number:');
    Object.keys(byCaseNumber).forEach(caseNum => {
      console.log(`\n  Case ${caseNum}: ${byCaseNumber[caseNum].length} interactions`);
      byCaseNumber[caseNum].forEach(i => {
        console.log(`    - ${i.interaction_type}: ${i.situation.substring(0, 40)}...`);
        console.log(`      Case exists in DB: ${i.case_id ? 'Yes' : 'No'}`);
        console.log(`      Case workspace: ${i.case_workspace_id || 'N/A'}`);
        console.log(`      Case deleted: ${i.case_deleted || 'N/A'}`);
      });
    });
    
    // 2. Check which cases actually exist in David's workspace
    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ Cases that ACTUALLY exist in David\'s workspace:');
    const actualCasesResult = await pool.query(
      `SELECT case_number, client_name 
       FROM cases 
       WHERE workspace_id = $1 
       AND (is_deleted = false OR is_deleted IS NULL)
       ORDER BY case_number`,
      [davidWorkspaceId]
    );
    
    actualCasesResult.rows.forEach(c => {
      console.log(`  - ${c.case_number}: ${c.client_name}`);
    });
    
    // 3. Identify orphaned interactions
    console.log('\n⚠️  PROBLEM IDENTIFIED:');
    const validCaseNumbers = actualCasesResult.rows.map(c => c.case_number);
    const orphanedCases = Object.keys(byCaseNumber).filter(cn => !validCaseNumbers.includes(cn));
    
    if (orphanedCases.length > 0) {
      console.log(`\nInteractions exist for ${orphanedCases.length} cases that are NOT in David's workspace:`);
      orphanedCases.forEach(cn => {
        console.log(`  - ${cn}: ${byCaseNumber[cn].length} orphaned interactions`);
      });
      
      console.log('\n🔧 These interactions have workspace_id set to David\'s workspace');
      console.log('   but their associated cases either:');
      console.log('   1. Don\'t exist in the database anymore');
      console.log('   2. Are assigned to a different workspace');
      console.log('   3. Are marked as deleted');
    }
    
    // 4. Check if these cases exist elsewhere
    console.log('\n' + '=' .repeat(70));
    console.log('\n🔍 Checking where these cases actually exist:');
    
    for (const caseNum of orphanedCases) {
      const caseCheck = await pool.query(
        `SELECT case_number, workspace_id, is_deleted 
         FROM cases 
         WHERE case_number = $1`,
        [caseNum]
      );
      
      if (caseCheck.rows.length > 0) {
        const c = caseCheck.rows[0];
        console.log(`  ${caseNum}:`);
        console.log(`    - Workspace: ${c.workspace_id || 'NULL'}`);
        console.log(`    - Deleted: ${c.is_deleted || false}`);
      } else {
        console.log(`  ${caseNum}: NOT FOUND in cases table`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

investigateDavidInteractions();