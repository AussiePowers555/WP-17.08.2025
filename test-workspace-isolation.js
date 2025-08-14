/**
 * Test script to verify workspace isolation for michaelalanwilson2016@outlook.com
 * This user should only see interactions for workspace: 571ab2ed-e9b0-42f4-a09c-2e74c2af7e6d
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testWorkspaceIsolation() {
  console.log('🔍 Testing workspace isolation for michaelalanwilson2016@outlook.com\n');
  
  try {
    // 1. Check user's workspace assignment
    console.log('1️⃣ Checking user workspace assignment...');
    const userResult = await pool.query(
      `SELECT id, email, role, workspace_id FROM user_accounts WHERE email = $1`,
      ['michaelalanwilson2016@outlook.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      workspace_id: user.workspace_id
    });
    
    // 2. Check workspace details
    console.log('\n2️⃣ Checking workspace details...');
    const workspaceResult = await pool.query(
      `SELECT id, name FROM workspaces WHERE id = $1`,
      [user.workspace_id]
    );
    
    if (workspaceResult.rows.length > 0) {
      const workspace = workspaceResult.rows[0];
      console.log('✅ Workspace:', {
        id: workspace.id,
        name: workspace.name
      });
    }
    
    // 3. Check cases in user's workspace
    console.log('\n3️⃣ Checking cases in user\'s workspace...');
    const casesResult = await pool.query(
      `SELECT id, case_number, client_name, workspace_id 
       FROM cases 
       WHERE workspace_id = $1 
       AND (is_deleted = false OR is_deleted IS NULL)
       ORDER BY case_number`,
      [user.workspace_id]
    );
    
    console.log(`✅ Found ${casesResult.rows.length} cases in workspace:`);
    casesResult.rows.forEach(c => {
      console.log(`   - ${c.case_number}: ${c.client_name}`);
    });
    
    // 4. Check interactions for these cases
    console.log('\n4️⃣ Checking interactions for workspace cases...');
    const interactionsResult = await pool.query(
      `SELECT 
        i.id,
        i.case_number,
        i.interaction_type,
        i.contact_name,
        i.situation,
        i.workspace_id,
        c.client_name
       FROM interactions i
       INNER JOIN cases c ON i.case_id = c.id
       WHERE c.workspace_id = $1
       AND (c.is_deleted = false OR c.is_deleted IS NULL)
       ORDER BY i.timestamp DESC`,
      [user.workspace_id]
    );
    
    console.log(`✅ Found ${interactionsResult.rows.length} interactions:`);
    interactionsResult.rows.forEach(i => {
      console.log(`   - Case ${i.case_number}: ${i.interaction_type} - ${i.situation.substring(0, 50)}...`);
    });
    
    // 5. Check for any cross-workspace contamination
    console.log('\n5️⃣ Checking for cross-workspace contamination...');
    const wrongWorkspaceResult = await pool.query(
      `SELECT 
        i.id,
        i.case_number,
        i.workspace_id as interaction_workspace,
        c.workspace_id as case_workspace,
        c.client_name
       FROM interactions i
       INNER JOIN cases c ON i.case_id = c.id
       WHERE i.workspace_id::text != c.workspace_id::text
       OR (i.workspace_id::text = $1::text AND c.workspace_id::text != $1::text)
       OR (i.workspace_id::text != $1::text AND c.workspace_id::text = $1::text)`,
      [user.workspace_id]
    );
    
    if (wrongWorkspaceResult.rows.length > 0) {
      console.log('⚠️ WARNING: Found mismatched workspace data:');
      wrongWorkspaceResult.rows.forEach(w => {
        console.log(`   - Case ${w.case_number}: interaction workspace=${w.interaction_workspace}, case workspace=${w.case_workspace}`);
      });
    } else {
      console.log('✅ No cross-workspace contamination detected');
    }
    
    // 6. Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`User: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Workspace ID: ${user.workspace_id}`);
    console.log(`Workspace Name: ${workspaceResult.rows[0]?.name || 'Unknown'}`);
    console.log(`Total Cases: ${casesResult.rows.length}`);
    console.log(`Total Interactions: ${interactionsResult.rows.length}`);
    console.log('\n✅ User should ONLY see the above interactions when logged in');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testWorkspaceIsolation();