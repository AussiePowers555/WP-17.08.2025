import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { getAuth } from '@/lib/server-auth';

// GET /api/workspaces/[id]/users - Get all users in a workspace
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    const auth = await getAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await context.params;

    // Check if user has access to this workspace
    const access = await DatabaseService.checkWorkspaceAccess(workspaceId, auth.userId);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all users in the workspace
    const users = await DatabaseService.getWorkspaceUsers(workspaceId);
    
    return NextResponse.json({ 
      users,
      currentUserRole: access.role,
      currentUserPermissions: access.permissions
    });
  } catch (error) {
    console.error('Error fetching workspace users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace users' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/users - Add a user to a workspace
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    const auth = await getAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await context.params;
    const body = await request.json();

    // Check if user has admin access to this workspace
    const access = await DatabaseService.checkWorkspaceAccess(workspaceId, auth.userId);
    if (!access.hasAccess || (access.role !== 'admin' && access.role !== 'developer')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email, display_name, role } = body;

    // Validate role
    if (!['admin', 'developer', 'client'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create user and add to workspace
    const result = await DatabaseService.createUserAndAddToWorkspace({
      email,
      display_name,
      role,
      workspace_id: workspaceId,
      invited_by: auth.userId
    });

    // Track credential distribution
    await DatabaseService.createCredentialDistribution({
      user_id: result.user.id,
      workspace_id: workspaceId,
      recipient_email: email,
      recipient_name: display_name,
      distribution_method: 'workspace_invitation',
      credentials_data: {
        email,
        tempPassword: result.tempPassword,
        workspace_id: workspaceId,
        role
      },
      distributed_by: auth.userId
    });

    return NextResponse.json({
      success: true,
      user: result.user,
      workspaceUser: result.workspaceUser,
      credentials: {
        email,
        password: result.tempPassword,
        loginUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://app.whitepointer.com'
      }
    });
  } catch (error) {
    console.error('Error adding user to workspace:', error);
    return NextResponse.json(
      { error: 'Failed to add user to workspace' },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[id]/users - Update a user's role in a workspace
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    const auth = await getAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await context.params;
    const body = await request.json();

    // Check if user has admin access to this workspace
    const access = await DatabaseService.checkWorkspaceAccess(workspaceId, auth.userId);
    if (!access.hasAccess || (access.role !== 'admin' && access.role !== 'developer')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { user_id, role, display_name, is_active } = body;

    // Validate role if provided
    if (role && !['admin', 'developer', 'client'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prevent user from modifying their own role
    if (user_id === auth.userId && role !== access.role) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 });
    }

    // Update user in workspace
    await DatabaseService.updateWorkspaceUser(workspaceId, user_id, {
      ...(role && { role }),
      ...(display_name !== undefined && { display_name }),
      ...(is_active !== undefined && { is_active })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating workspace user:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace user' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id]/users/[userId] - Remove a user from a workspace
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    const auth = await getAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await context.params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if user has admin access to this workspace
    const access = await DatabaseService.checkWorkspaceAccess(workspaceId, auth.userId);
    if (!access.hasAccess || (access.role !== 'admin' && access.role !== 'developer')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Prevent user from removing themselves
    if (userId === auth.userId) {
      return NextResponse.json({ error: 'Cannot remove yourself from workspace' }, { status: 400 });
    }

    // Remove user from workspace (soft delete)
    await DatabaseService.removeWorkspaceUser(workspaceId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user from workspace:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from workspace' },
      { status: 500 }
    );
  }
}