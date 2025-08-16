const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkInteractionsDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking interactions database...');
    
    // Check if interactions table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'interactions'
      );
    `);
    
    console.log('📋 Interactions table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Get table structure
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'interactions' 
        ORDER BY ordinal_position;
      `);
      
      console.log('📝 Table structure:');
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Count total interactions
      const countResult = await pool.query('SELECT COUNT(*) as total FROM interactions');
      console.log(`📊 Total interactions: ${countResult.rows[0].total}`);
      
      // Get recent interactions
      const recentResult = await pool.query(`
        SELECT 
          id, case_number, interaction_type, timestamp, 
          contact_name, workspace_id, created_by
        FROM interactions 
        ORDER BY timestamp DESC 
        LIMIT 5
      `);
      
      console.log('📅 Recent interactions:');
      recentResult.rows.forEach(int => {
        console.log(`  - ID: ${int.id} | Case: ${int.case_number} | Type: ${int.interaction_type} | Contact: ${int.contact_name} | Workspace: ${int.workspace_id}`);
      });
      
      // Check workspace distribution
      const workspaceResult = await pool.query(`
        SELECT workspace_id, COUNT(*) as count 
        FROM interactions 
        GROUP BY workspace_id 
        ORDER BY count DESC
      `);
      
      console.log('🏢 Interactions by workspace:');
      workspaceResult.rows.forEach(ws => {
        console.log(`  - Workspace ${ws.workspace_id}: ${ws.count} interactions`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkInteractionsDatabase();