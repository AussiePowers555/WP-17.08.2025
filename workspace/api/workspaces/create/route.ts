import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { hashPassword } from '@/lib/passwords';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();
    
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await DatabaseService.getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Generate IDs
    const workspaceId = uuidv4();
    const userId = uuidv4();

    // Hash the password using SHA256 (same as login system)
    const hashedPassword = hashPassword(password);

    // Create workspace
    const newWorkspace = await DatabaseService.createWorkspace({
      id: workspaceId,
      name,
      contactId: null // No contact initially
    });

    // Create user with workspace access
    const newUser = await DatabaseService.createUserAccount({
      id: userId,
      email,
      password_hash: hashedPassword,
      role: 'workspace_user',
      workspace_id: workspaceId,
      status: 'active',
      first_login: false
    });

    console.log('[Workspace Create] Created workspace:', {
      workspaceId,
      name,
      email,
      userId
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspaceId,
        name
      },
      credentials: {
        email,
        password, // Return the original password for display to the user
        username: email
      },
      message: 'Workspace and user created successfully'
    });

  } catch (error) {
    console.error('[Workspace Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}