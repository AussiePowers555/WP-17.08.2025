const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addInteractionTracking() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Adding interaction tracking system...');
    
    // Step 1: Add interaction_number column to interactions table
    console.log('\n1️⃣ Adding interaction_number column...');
    const addColumnQuery = `
      ALTER TABLE interactions 
      ADD COLUMN IF NOT EXISTS interaction_number INTEGER
    `;
    
    await pool.query(addColumnQuery);
    console.log('✅ interaction_number column added');
    
    // Step 2: Create function to auto-assign interaction numbers
    console.log('\n2️⃣ Creating auto-increment function...');
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION assign_interaction_number()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Auto-assign the next interaction number for this case
        SELECT COALESCE(MAX(interaction_number), 0) + 1
        INTO NEW.interaction_number
        FROM interactions
        WHERE case_number = NEW.case_number;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await pool.query(createFunctionQuery);
    console.log('✅ Auto-increment function created');
    
    // Step 3: Create trigger to run the function on INSERT
    console.log('\n3️⃣ Creating trigger...');
    const createTriggerQuery = `
      DROP TRIGGER IF EXISTS interaction_number_trigger ON interactions;
      CREATE TRIGGER interaction_number_trigger
        BEFORE INSERT ON interactions
        FOR EACH ROW
        EXECUTE FUNCTION assign_interaction_number();
    `;
    
    await pool.query(createTriggerQuery);
    console.log('✅ Trigger created');
    
    // Step 4: Backfill existing interactions with numbers
    console.log('\n4️⃣ Backfilling existing interactions...');
    const backfillQuery = `
      UPDATE interactions
      SET interaction_number = subq.row_num
      FROM (
        SELECT 
          id, 
          ROW_NUMBER() OVER (PARTITION BY case_number ORDER BY created_at, id) as row_num
        FROM interactions
        WHERE interaction_number IS NULL
      ) subq
      WHERE interactions.id = subq.id
    `;
    
    const backfillResult = await pool.query(backfillQuery);
    console.log(`✅ Backfilled ${backfillResult.rowCount} existing interactions`);
    
    // Step 5: Verify the implementation
    console.log('\n5️⃣ Verifying implementation...');
    const verifyQuery = `
      SELECT 
        case_number,
        id,
        interaction_number,
        interaction_type,
        contact_name,
        created_at
      FROM interactions
      WHERE case_number IN ('MOCK-004', 'MOCK-001', 'CASE-105519')
      ORDER BY case_number, interaction_number
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    console.log('\n📊 Interaction numbering verification:');
    
    let currentCase = '';
    verifyResult.rows.forEach(row => {
      if (row.case_number !== currentCase) {
        console.log(`\n📋 ${row.case_number}:`);
        currentCase = row.case_number;
      }
      console.log(`  #${row.interaction_number}: ID ${row.id} | ${row.interaction_type} | ${row.contact_name || 'No contact'}`);
    });
    
    console.log('\n🎯 Interaction tracking system implemented successfully!');
    console.log('📝 New interactions will automatically get numbered starting from the next available number for each case.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addInteractionTracking();