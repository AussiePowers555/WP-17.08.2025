import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    await ensureDatabaseInitialized();
    
    // Restore the case from trash
    const restored = await DatabaseService.restoreCase(id);
    
    if (!restored) {
      return NextResponse.json(
        { error: 'Case not found or already restored' },
        { status: 404 }
      );
    }
    
    console.log(`♻️ Restored case ${id} from trash`);
    
    return NextResponse.json({
      success: true,
      message: 'Case restored successfully'
    });
  } catch (error) {
    console.error(`Error restoring case ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to restore case' },
      { status: 500 }
    );
  }
}