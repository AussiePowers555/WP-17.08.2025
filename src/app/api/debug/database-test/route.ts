import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    // Get connection directly to test
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ error: 'Database URL not configured' }, { status: 500 });
    }
    
    const pool = new Pool({ connectionString });
    const client = await pool.connect();
    
    try {
      // Check if the is_deleted column exists
      const columnCheck = await client.query(`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'cases' 
        AND column_name IN ('is_deleted', 'deleted_at')
      `);
      
      // Get a sample of cases to see their is_deleted values
      const casesCheck = await client.query(`
        SELECT id, case_number, is_deleted, deleted_at 
        FROM cases 
        ORDER BY last_updated DESC 
        LIMIT 10
      `);
      
      // Get count of deleted vs non-deleted cases
      const deletedCount = await client.query(`
        SELECT 
          COUNT(CASE WHEN is_deleted = true THEN 1 END) as deleted_count,
          COUNT(CASE WHEN is_deleted = false OR is_deleted IS NULL THEN 1 END) as active_count,
          COUNT(*) as total_count
        FROM cases
      `);
      
      return NextResponse.json({
        columns_exist: columnCheck.rows,
        sample_cases: casesCheck.rows,
        case_counts: deletedCount.rows[0],
        database_url_configured: !!connectionString,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}