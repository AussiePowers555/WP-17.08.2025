import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  const caseNumber = request.nextUrl.searchParams.get('case');
  
  if (!caseNumber) {
    return NextResponse.json({ 
      error: 'Please provide ?case=CASE_NUMBER',
      example: '/api/force-delete-case?case=MOCK-004'
    }, { status: 400 });
  }
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // First, find the case
    const findResult = await client.query(
      'SELECT * FROM cases WHERE case_number = $1',
      [caseNumber]
    );
    
    if (findResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ 
        error: 'Case not found',
        searched_for: caseNumber,
        message: 'The case does not exist in the database'
      }, { status: 404 });
    }
    
    const caseData = findResult.rows[0];
    const caseId = caseData.id;
    
    console.log(`Found case to delete: ${caseNumber} with ID: ${caseId}`);
    
    // Delete all related data first (to avoid foreign key constraints)
    const deletions = [];
    
    // Delete interactions
    try {
      const interactionsResult = await client.query(
        'DELETE FROM interactions WHERE case_id = $1',
        [caseId]
      );
      deletions.push(`Deleted ${interactionsResult.rowCount} interactions`);
    } catch (e) {
      console.log('No interactions table or no rows to delete');
    }
    
    // Delete signature tokens
    try {
      const tokensResult = await client.query(
        'DELETE FROM signature_tokens WHERE case_id = $1',
        [caseId]
      );
      deletions.push(`Deleted ${tokensResult.rowCount} signature tokens`);
    } catch (e) {
      console.log('No signature_tokens table or no rows to delete');
    }
    
    // Delete digital signatures
    try {
      const signaturesResult = await client.query(
        'DELETE FROM digital_signatures WHERE case_id = $1',
        [caseId]
      );
      deletions.push(`Deleted ${signaturesResult.rowCount} digital signatures`);
    } catch (e) {
      console.log('No digital_signatures table or no rows to delete');
    }
    
    // Now delete the case itself
    const deleteResult = await client.query(
      'DELETE FROM cases WHERE id = $1 RETURNING *',
      [caseId]
    );
    
    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ 
        error: 'Failed to delete case',
        case_data: caseData,
        deletions
      }, { status: 500 });
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Verify it's really gone
    const verifyResult = await client.query(
      'SELECT * FROM cases WHERE case_number = $1',
      [caseNumber]
    );
    
    return NextResponse.json({
      success: true,
      message: `Case ${caseNumber} has been FORCE DELETED successfully`,
      deleted_case: deleteResult.rows[0],
      related_deletions: deletions,
      verification: {
        case_still_exists: verifyResult.rows.length > 0,
        remaining_cases_count: verifyResult.rows.length
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Force delete error:', error);
    
    // Try one more time with CASCADE
    try {
      await client.query('BEGIN');
      
      // Try to drop all constraints and delete
      const cascadeDelete = await client.query(
        `DELETE FROM cases WHERE case_number = $1`,
        [caseNumber]
      );
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: 'Case deleted with cascade fallback',
        deleted_rows: cascadeDelete.rowCount
      });
      
    } catch (cascadeError) {
      await client.query('ROLLBACK');
      
      return NextResponse.json({
        error: 'Force delete failed',
        details: String(error),
        cascade_error: String(cascadeError),
        case_number: caseNumber,
        suggestion: 'There may be database constraints preventing deletion'
      }, { status: 500 });
    }
  } finally {
    client.release();
    await pool.end();
  }
}