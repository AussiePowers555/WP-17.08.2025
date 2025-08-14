import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { interactionId } = await request.json();
    
    if (!interactionId) {
      return NextResponse.json(
        { success: false, error: 'Interaction ID is required' },
        { status: 400 }
      );
    }

    await ensureDatabaseInitialized();
    
    // Delete the interaction using the DatabaseService
    const success = await (DatabaseService as any).deleteCaseInteraction?.(interactionId);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Interaction deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Interaction not found or could not be deleted' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting interaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete interaction' },
      { status: 500 }
    );
  }
}