import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { requireAdmin, authenticateRequest } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await context.params;
    
    // Users can access their own workspace or admins can access any workspace
    if (auth.user.role !== 'admin' && auth.user.role !== 'developer' && auth.user.workspaceId !== id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const workspace = await DatabaseService.getWorkspaceById(id);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }
    
    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
    const { id } = await context.params;
    const updates = await request.json();
        await DatabaseService.updateWorkspace(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json({ error: 'Failed to update workspace', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
    const { id } = await context.params;
        await DatabaseService.deleteWorkspace(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json({ error: 'Failed to delete workspace', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}