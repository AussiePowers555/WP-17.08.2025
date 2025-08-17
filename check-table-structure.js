const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkTableStructure() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking table structures...');
    
    // Check interactions table structure
    console.log('\n📋 Interactions table structure:');
    const intQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'interactions'
      ORDER BY ordinal_position
    `;
    
    const intResult = await pool.query(intQuery);
    intResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check cases table structure
    console.log('\n📋 Cases table structure:');
    const casesQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cases'
      ORDER BY ordinal_position
    `;
    
    const casesResult = await pool.query(casesQuery);
    casesResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check sample data
    console.log('\n🔍 Sample workspace_id data:');
    const sampleQuery = `
      SELECT 
        i.case_number,
        i.workspace_id::text as int_workspace,
        c.workspace_id::text as case_workspace,
        pg_typeof(i.workspace_id) as int_type,
        pg_typeof(c.workspace_id) as case_type
      FROM interactions i
      LEFT JOIN cases c ON i.case_number = c.case_number
      LIMIT 3
    `;
    
    const sampleResult = await pool.query(sampleQuery);
    sampleResult.rows.forEach(row => {
      console.log(`  - ${row.case_number}: Int(${row.int_type})=${row.int_workspace}, Case(${row.case_type})=${row.case_workspace}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure();