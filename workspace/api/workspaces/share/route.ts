import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { hashPassword } from '@/lib/passwords';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();
    
    const { workspaceId, email, password } = await request.json();

    if (!workspaceId || !email || !password) {
      return NextResponse.json(
        { error: 'Workspace ID, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if workspace exists
    const workspace = await DatabaseService.getWorkspaceById(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check if email already exists
    const existingUser = await DatabaseService.getUserByEmail(email);

    if (existingUser) {
      // User exists - update their workspace access
      await DatabaseService.updateUserAccount(existingUser.id, {
        workspace_id: workspaceId
      });

      console.log('[Workspace Share] Updated existing user workspace access:', {
        userId: existingUser.id,
        workspaceId,
        email
      });

      return NextResponse.json({
        success: true,
        workspace: {
          id: workspaceId,
          name: workspace.name
        },
        message: 'User workspace access updated',
        isExistingUser: true
      });
    }

    // Create new user with workspace access
    const userId = uuidv4();
    const hashedPassword = hashPassword(password);

    const newUser = await DatabaseService.createUserAccount({
      id: userId,
      email,
      password_hash: hashedPassword,
      role: 'workspace_user',
      workspace_id: workspaceId,
      status: 'active',
      first_login: false
    });

    console.log('[Workspace Share] Created new user with workspace access:', {
      userId,
      workspaceId,
      workspaceName: workspace.name,
      email
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspaceId,
        name: workspace.name
      },
      credentials: {
        email,
        password, // Return the original password for display
        username: email
      },
      message: 'User created with workspace access',
      isNewUser: true
    });

  } catch (error) {
    console.error('[Workspace Share] Error:', error);
    return NextResponse.json(
      { error: 'Failed to share workspace' },
      { status: 500 }
    );
  }
}