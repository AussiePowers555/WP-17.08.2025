import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Allow GET for easy browser access
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ error: 'Database URL not configured' }, { status: 500 });
    }
    
    const pool = new Pool({ connectionString });
    const client = await pool.connect();
    
    try {
      console.log('🔄 Running migration to add is_deleted columns...');
      
      // Force add the columns even if they exist (will update defaults)
      const migrations = [];
      
      // Check and add is_deleted column
      const checkDeleted = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='cases' AND column_name='is_deleted'
      `);
      
      if (checkDeleted.rows.length === 0) {
        console.log('Adding is_deleted column...');
        await client.query(`ALTER TABLE cases ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE`);
        migrations.push('Added is_deleted column');
      } else {
        // Ensure default is set correctly
        await client.query(`ALTER TABLE cases ALTER COLUMN is_deleted SET DEFAULT FALSE`);
        migrations.push('Updated is_deleted default');
      }
      
      // Check and add deleted_at column
      const checkDeletedAt = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='cases' AND column_name='deleted_at'
      `);
      
      if (checkDeletedAt.rows.length === 0) {
        console.log('Adding deleted_at column...');
        await client.query(`ALTER TABLE cases ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE`);
        migrations.push('Added deleted_at column');
      }
      
      // Update any NULL is_deleted values to FALSE
      const updateResult = await client.query(`
        UPDATE cases 
        SET is_deleted = FALSE 
        WHERE is_deleted IS NULL
      `);
      migrations.push(`Updated ${updateResult.rowCount} rows with NULL is_deleted to FALSE`);
      
      // Get current state
      const columnCheck = await client.query(`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'cases' 
        AND column_name IN ('is_deleted', 'deleted_at')
      `);
      
      const caseCount = await client.query(`
        SELECT 
          COUNT(CASE WHEN is_deleted = true THEN 1 END) as deleted_count,
          COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_count,
          COUNT(CASE WHEN is_deleted IS NULL THEN 1 END) as null_count,
          COUNT(*) as total_count
        FROM cases
      `);
      
      console.log('✅ Migration completed successfully');
      
      return NextResponse.json({
        success: true,
        migrations,
        columns: columnCheck.rows,
        case_counts: caseCount.rows[0],
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}