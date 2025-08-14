import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  const caseNumber = request.nextUrl.searchParams.get('case');
  
  if (!caseNumber) {
    return NextResponse.json({ error: 'Please provide ?case=CASE_NUMBER' }, { status: 400 });
  }
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  
  try {
    // First, check if the case exists
    const checkResult = await client.query(
      'SELECT id, case_number, is_deleted FROM cases WHERE case_number = $1',
      [caseNumber]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Case not found',
        searched_for: caseNumber
      }, { status: 404 });
    }
    
    const caseData = checkResult.rows[0];
    
    // Now delete it
    const deleteResult = await client.query(
      'DELETE FROM cases WHERE case_number = $1 RETURNING *',
      [caseNumber]
    );
    
    return NextResponse.json({
      success: true,
      message: `Case ${caseNumber} deleted successfully`,
      case_before_delete: caseData,
      deleted_rows: deleteResult.rowCount,
      deleted_case: deleteResult.rows[0]
    });
    
  } catch (error) {
    console.error('Test delete error:', error);
    return NextResponse.json({
      error: 'Database error',
      details: String(error),
      case_number: caseNumber
    }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}