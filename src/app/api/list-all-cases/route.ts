import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  
  try {
    // Get ALL cases, including deleted ones
    const result = await client.query(
      'SELECT id, case_number, client_name, status, is_deleted, deleted_at, created_at FROM cases ORDER BY created_at DESC'
    );
    
    // Check if is_deleted column exists
    let hasIsDeleted = false;
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'is_deleted'
      `);
      hasIsDeleted = columnCheck.rows.length > 0;
    } catch (e) {
      console.log('Could not check for is_deleted column');
    }
    
    return NextResponse.json({
      total_cases: result.rows.length,
      has_is_deleted_column: hasIsDeleted,
      cases: result.rows,
      database_info: {
        connected: true,
        database_url_exists: !!connectionString
      }
    });
    
  } catch (error) {
    console.error('List cases error:', error);
    return NextResponse.json({
      error: 'Failed to list cases',
      details: String(error)
    }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}