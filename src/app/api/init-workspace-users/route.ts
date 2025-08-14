import { NextResponse } from 'next/server';
import { ensureDatabaseInitialized } from '@/lib/database';

export async function GET() {
  try {
    // Ensure database is initialized (which includes workspace_users table)
    await ensureDatabaseInitialized();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized with workspace_users table'
    });
  } catch (error) {
    console.error('Error ensuring database initialization:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}