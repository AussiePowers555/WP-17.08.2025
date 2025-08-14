import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { requireAdmin } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    // Only admins/developers can list and switch workspaces
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
    const workspaces = await DatabaseService.getAllWorkspaces();
    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({ error: 'Failed to fetch workspaces', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
    const workspaceData = await request.json();
        const newWorkspace = await DatabaseService.createWorkspace(workspaceData);
    return NextResponse.json(newWorkspace, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: 'Failed to create workspace', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}