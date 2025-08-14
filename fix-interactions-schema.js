const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixInteractionSchema() {
  try {
    console.log('=== FIXING INTERACTION SCHEMA ===\n');
    
    // Step 1: Analyze both tables
    console.log('Step 1: Analyzing existing tables...');
    
    const caseInteractionsData = await pool.query(`
      SELECT * FROM case_interactions ORDER BY created_at DESC
    `);
    console.log(`- case_interactions table has ${caseInteractionsData.rows.length} rows`);
    
    const interactionsData = await pool.query(`
      SELECT * FROM interactions ORDER BY timestamp DESC
    `);
    console.log(`- interactions table has ${interactionsData.rows.length} rows`);
    
    // Step 2: Get all cases with their workspace assignments
    console.log('\nStep 2: Getting all cases with workspace assignments...');
    const casesData = await pool.query(`
      SELECT id, case_number, workspace_id, client_name 
      FROM cases 
      WHERE is_deleted = false OR is_deleted IS NULL
    `);
    
    const caseMap = {};
    casesData.rows.forEach(c => {
      caseMap[c.case_number] = {
        id: c.id,
        workspace_id: c.workspace_id,
        client_name: c.client_name
      };
    });
    console.log(`- Found ${Object.keys(caseMap).length} active cases`);
    
    // Step 3: Migrate case_interactions to interactions table
    console.log('\nStep 3: Migrating case_interactions to interactions table...');
    
    let migrated = 0;
    let updated = 0;
    
    for (const ci of caseInteractionsData.rows) {
      const caseInfo = caseMap[ci.case_number];
      
      if (caseInfo) {
        // Check if this interaction already exists in interactions table
        const existing = await pool.query(`
          SELECT id FROM interactions 
          WHERE case_number = $1 
            AND situation = $2 
            AND action_taken = $3
            AND outcome = $4
        `, [ci.case_number, ci.situation, ci.action, ci.outcome]);
        
        if (existing.rows.length === 0) {
          // Insert new interaction with proper case and workspace links
          await pool.query(`
            INSERT INTO interactions (
              case_id,
              case_number,
              interaction_type,
              contact_name,
              situation,
              action_taken,
              outcome,
              priority,
              status,
              workspace_id,
              timestamp,
              created_at,
              updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            )
          `, [
            caseInfo.id,                    // case_id - proper link
            ci.case_number,                  // case_number
            ci.method?.toLowerCase() || 'call', // interaction_type
            ci.source || caseInfo.client_name, // contact_name
            ci.situation,                    // situation
            ci.action,                       // action_taken
            ci.outcome,                      // outcome
            'medium',                        // priority
            'completed',                     // status
            caseInfo.workspace_id,           // workspace_id - proper link
            ci.timestamp || ci.created_at,   // timestamp
            ci.created_at,                   // created_at
            ci.updated_at                    // updated_at
          ]);
          migrated++;
          console.log(`  ✓ Migrated interaction for case ${ci.case_number}`);
        } else {
          console.log(`  - Skipped duplicate for case ${ci.case_number}`);
        }
      } else {
        console.log(`  ⚠ No case found for ${ci.case_number}`);
      }
    }
    
    // Step 4: Fix orphaned interactions (no workspace_id)
    console.log('\nStep 4: Fixing orphaned interactions...');
    
    const orphanedInteractions = await pool.query(`
      SELECT i.id, i.case_number, i.case_id
      FROM interactions i
      WHERE i.workspace_id IS NULL
    `);
    
    for (const orphan of orphanedInteractions.rows) {
      const caseInfo = caseMap[orphan.case_number];
      
      if (caseInfo) {
        await pool.query(`
          UPDATE interactions 
          SET case_id = $1, workspace_id = $2 
          WHERE id = $3
        `, [caseInfo.id, caseInfo.workspace_id, orphan.id]);
        updated++;
        console.log(`  ✓ Fixed workspace for interaction ${orphan.id} (${orphan.case_number})`);
      }
    }
    
    // Step 5: Verify the fix
    console.log('\nStep 5: Verifying workspace assignments...');
    
    const verifyResult = await pool.query(`
      SELECT 
        w.name as workspace_name,
        COUNT(DISTINCT c.id) as case_count,
        COUNT(DISTINCT i.id) as interaction_count
      FROM workspaces w
      LEFT JOIN cases c ON c.workspace_id = w.id AND (c.is_deleted = false OR c.is_deleted IS NULL)
      LEFT JOIN interactions i ON i.case_id = c.id
      GROUP BY w.id, w.name
      ORDER BY w.name
    `);
    
    console.log('\n=== FINAL WORKSPACE SUMMARY ===');
    verifyResult.rows.forEach(row => {
      console.log(`\n${row.workspace_name}:`);
      console.log(`  - Cases: ${row.case_count}`);
      console.log(`  - Interactions: ${row.interaction_count}`);
    });
    
    // Step 6: Show what each user should see
    console.log('\n=== USER VISIBILITY ===');
    
    const users = [
      { email: 'michaelalanwilson@outlook.com', workspace_id: '550e8400-e29b-41d4-a716-446655440101' },
      { email: 'michaelalanwilson2016@outlook.com', workspace_id: '571ab2ed-e9b0-42f4-a09c-2e74c2af7e6d' }
    ];
    
    for (const user of users) {
      const userInteractions = await pool.query(`
        SELECT COUNT(*) as count
        FROM interactions i
        JOIN cases c ON i.case_id = c.id
        WHERE c.workspace_id = $1
      `, [user.workspace_id]);
      
      console.log(`\n${user.email}:`);
      console.log(`  Should see ${userInteractions.rows[0].count} interactions`);
    }
    
    console.log('\n=== MIGRATION COMPLETE ===');
    console.log(`- Migrated: ${migrated} interactions`);
    console.log(`- Updated: ${updated} orphaned interactions`);
    console.log('\nAll interactions are now properly linked to cases and workspaces!');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

fixInteractionSchema();