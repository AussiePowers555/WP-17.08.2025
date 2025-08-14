import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { requireAuth } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Only admins can list all workspaces
    if (user.role !== 'admin' && user.role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Ensure database is initialized
    await ensureDatabaseInitialized();

    // Get all workspaces
    const workspaces = await DatabaseService.getAllWorkspaces();

    // Transform to frontend format
    const formattedWorkspaces = workspaces.map((workspace: any) => ({
      id: workspace.id,
      name: workspace.name,
      contactId: workspace.contact_id,
      type: workspace.type
    }));

    return NextResponse.json(formattedWorkspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}