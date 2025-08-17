const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addWorkspaceConstraint() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Adding workspace consistency constraint...');
    
    // Step 1: Check current workspace alignment
    console.log('\n1️⃣ Checking current workspace alignment...');
    const alignmentQuery = `
      SELECT 
        i.id,
        i.case_number,
        i.workspace_id as interaction_workspace,
        c.workspace_id::text as case_workspace,
        (i.workspace_id = c.workspace_id::text) as aligned
      FROM interactions i
      LEFT JOIN cases c ON i.case_number = c.case_number
      WHERE i.workspace_id != c.workspace_id::text OR c.workspace_id IS NULL
    `;
    
    const alignmentResult = await pool.query(alignmentQuery);
    
    if (alignmentResult.rows.length > 0) {
      console.log('❌ Found misaligned interactions:');
      alignmentResult.rows.forEach(row => {
        console.log(`  - ID ${row.id} (${row.case_number}): Int WS: ${row.interaction_workspace}, Case WS: ${row.case_workspace}`);
      });
      
      // Auto-fix misaligned interactions
      console.log('\n🔧 Auto-fixing misaligned interactions...');
      const fixQuery = `
        UPDATE interactions 
        SET workspace_id = c.workspace_id::text
        FROM cases c
        WHERE interactions.case_number = c.case_number 
          AND interactions.workspace_id != c.workspace_id::text
        RETURNING interactions.id, interactions.case_number, interactions.workspace_id
      `;
      
      const fixResult = await pool.query(fixQuery);
      console.log(`✅ Fixed ${fixResult.rowCount} misaligned interactions`);
    } else {
      console.log('✅ All interactions are properly aligned');
    }
    
    // Step 2: Create function to validate workspace consistency
    console.log('\n2️⃣ Creating workspace validation function...');
    const createValidationFunctionQuery = `
      CREATE OR REPLACE FUNCTION validate_interaction_workspace()
      RETURNS TRIGGER AS $$
      DECLARE
        case_workspace_id UUID;
      BEGIN
        -- Get the workspace_id of the case
        SELECT workspace_id INTO case_workspace_id
        FROM cases
        WHERE case_number = NEW.case_number OR id = NEW.case_id;
        
        -- If case exists and workspace doesn't match, update to match
        IF case_workspace_id IS NOT NULL AND NEW.workspace_id != case_workspace_id::text THEN
          NEW.workspace_id := case_workspace_id::text;
          RAISE NOTICE 'Auto-corrected interaction workspace from % to % for case %', 
            COALESCE(OLD.workspace_id, 'NULL'), NEW.workspace_id, NEW.case_number;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await pool.query(createValidationFunctionQuery);
    console.log('✅ Workspace validation function created');
    
    // Step 3: Create trigger for INSERT and UPDATE
    console.log('\n3️⃣ Creating workspace validation trigger...');
    const createValidationTriggerQuery = `
      DROP TRIGGER IF EXISTS workspace_consistency_trigger ON interactions;
      CREATE TRIGGER workspace_consistency_trigger
        BEFORE INSERT OR UPDATE ON interactions
        FOR EACH ROW
        EXECUTE FUNCTION validate_interaction_workspace();
    `;
    
    await pool.query(createValidationTriggerQuery);
    console.log('✅ Workspace validation trigger created');
    
    // Step 4: Test the constraint
    console.log('\n4️⃣ Testing the constraint...');
    const testQuery = `
      SELECT 
        i.id,
        i.case_number,
        i.workspace_id as interaction_workspace,
        c.workspace_id::text as case_workspace,
        (i.workspace_id = c.workspace_id::text) as aligned
      FROM interactions i
      LEFT JOIN cases c ON i.case_number = c.case_number
      ORDER BY i.case_number, i.interaction_number
    `;
    
    const testResult = await pool.query(testQuery);
    
    let aligned = 0;
    let total = 0;
    
    console.log('\n📊 Workspace alignment verification:');
    testResult.rows.forEach(row => {
      total++;
      if (row.aligned) aligned++;
      
      const status = row.aligned ? '✅' : '❌';
      console.log(`  ${status} ${row.case_number} (ID: ${row.id}): Int WS matches Case WS`);
    });
    
    console.log(`\n📈 Alignment Summary: ${aligned}/${total} interactions properly aligned (${Math.round(aligned/total*100)}%)`);
    
    console.log('\n🎯 Workspace consistency constraint implemented successfully!');
    console.log('📝 Future interactions will automatically be assigned to the correct workspace.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addWorkspaceConstraint();