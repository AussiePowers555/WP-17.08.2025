import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { hashPassword, generateTempPassword as genTemp } from '@/lib/passwords';

// Utility to generate a reasonably strong temp password
const generateTempPassword = () => genTemp(12);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const updates = await request.json();
    
    console.log(`[PUT /api/users/${id}] Updating user with:`, updates);
    
    await ensureDatabaseInitialized();
    
    // If password is being updated, hash it
    if (updates.password) {
      updates.password_hash = hashPassword(updates.password);
      delete updates.password;
    }
    
    // Ensure updated_at is set
    updates.updated_at = new Date().toISOString();
    
    // Update the user account
    await DatabaseService.updateUserAccount(id, updates);
    
    // Fetch all users and find the updated one to confirm changes
    const allUsers = await DatabaseService.getAllUserAccounts();
    const updatedUser = allUsers.find(u => u.id === id);
    
    console.log(`[PUT /api/users/${id}] User updated successfully:`, {
      id: updatedUser?.id,
      email: updatedUser?.email,
      role: updatedUser?.role,
      status: updatedUser?.status
    });
    
    return NextResponse.json({
      success: true,
      message: `User updated successfully. Role is now: ${updatedUser?.role}`,
      user: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        role: updatedUser?.role,
        status: updatedUser?.status
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // POST /api/users/{id} with body { action: "generate-temp-password" }
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (action !== 'generate-temp-password') {
      return NextResponse.json(
        { success: false, error: 'Unsupported action' },
        { status: 400 }
      );
    }

    await ensureDatabaseInitialized();

    // Generate and hash new temp password, set status to pending_password_change
    const tempPassword = generateTempPassword();
    const password_hash = hashPassword(tempPassword);

    await DatabaseService.updateUserAccount(id, {
      password_hash,
      status: 'active',  // Keep active so user can login
      updated_at: new Date() as any,
      first_login: 0  // Set to 0 - no forced password change
    });

    return NextResponse.json({
      success: true,
      tempPassword
    });
  } catch (error) {
    console.error('Error generating temp password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate temporary password' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    console.log(`[DELETE /api/users/${id}] Starting user deletion`);
    
    await ensureDatabaseInitialized();
    
    // Actually delete the user from the database
    const deleted = await DatabaseService.deleteUserAccount(id);
    
    if (!deleted) {
      console.error(`[DELETE /api/users/${id}] User not found or already deleted`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`[DELETE /api/users/${id}] User deleted successfully`);
    
    return NextResponse.json({
      success: true,
      message: 'User permanently deleted'
    });
  } catch (error) {
    console.error(`[DELETE /api/users/${id}] Error:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}