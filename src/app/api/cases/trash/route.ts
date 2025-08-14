import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    // Get all deleted cases
    const deletedCases = await DatabaseService.getDeletedCases();
    
    return NextResponse.json({
      success: true,
      cases: deletedCases,
      count: deletedCases.length
    });
  } catch (error) {
    console.error('Error fetching deleted cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deleted cases' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    // Empty the trash - permanently delete all soft-deleted cases
    const deletedCount = await DatabaseService.emptyTrash();
    
    console.log(`🗑️ Permanently deleted ${deletedCount} cases from trash`);
    
    return NextResponse.json({
      success: true,
      message: `Permanently deleted ${deletedCount} cases`,
      count: deletedCount
    });
  } catch (error) {
    console.error('Error emptying trash:', error);
    return NextResponse.json(
      { error: 'Failed to empty trash' },
      { status: 500 }
    );
  }
}