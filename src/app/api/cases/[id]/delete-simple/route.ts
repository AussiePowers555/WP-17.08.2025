import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  console.log(`[DELETE-SIMPLE] Attempting to delete: ${id}`);
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  
  try {
    // First try to find the case by ID or case number
    let result = await client.query(
      'SELECT id, case_number FROM cases WHERE id = $1 OR case_number = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log(`[DELETE-SIMPLE] Case not found: ${id}`);
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    const caseToDelete = result.rows[0];
    console.log(`[DELETE-SIMPLE] Found case:`, caseToDelete);
    
    // Actually DELETE the case from the database
    const deleteResult = await client.query(
      'DELETE FROM cases WHERE id = $1',
      [caseToDelete.id]
    );
    
    console.log(`[DELETE-SIMPLE] Delete result:`, deleteResult.rowCount);
    
    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
    }
    
    console.log(`[DELETE-SIMPLE] Successfully deleted case ${caseToDelete.case_number}`);
    
    return NextResponse.json({
      success: true,
      message: `Case ${caseToDelete.case_number} deleted successfully`,
      deletedCase: caseToDelete
    });
    
  } catch (error) {
    console.error('[DELETE-SIMPLE] Error:', error);
    return NextResponse.json(
      { error: 'Database error', details: String(error) },
      { status: 500 }
    );
  } finally {
    client.release();
    await pool.end();
  }
}