import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseNumber } = body;
    
    console.log(`[DELETE-CASE] Attempting to delete: ${caseNumber}`);
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const pool = new Pool({ 
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    const client = await pool.connect();
    
    try {
      // First try to find the case by case number
      const result = await client.query(
        'SELECT id, case_number FROM cases WHERE case_number = $1',
        [caseNumber]
      );
      
      if (result.rows.length === 0) {
        console.log(`[DELETE-CASE] Case not found: ${caseNumber}`);
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      }
      
      const caseToDelete = result.rows[0];
      console.log(`[DELETE-CASE] Found case:`, caseToDelete);
      
      // Mark the case as deleted instead of deleting it completely
      const deleteResult = await client.query(
        'UPDATE cases SET is_deleted = true, last_updated = NOW() WHERE id = $1',
        [caseToDelete.id]
      );
      
      console.log(`[DELETE-CASE] Delete result:`, deleteResult.rowCount);
      
      if (deleteResult.rowCount === 0) {
        return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
      }
      
      console.log(`[DELETE-CASE] Successfully deleted case ${caseToDelete.case_number}`);
      
      return NextResponse.json({
        success: true,
        message: `Case ${caseToDelete.case_number} deleted successfully`,
        deletedCase: caseToDelete
      });
      
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('[DELETE-CASE] Error:', error);
    return NextResponse.json(
      { error: 'Database error', details: String(error) },
      { status: 500 }
    );
  }
}