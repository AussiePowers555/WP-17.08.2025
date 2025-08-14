import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseInitialized, db } from '@/lib/database';
import { authenticateRequest } from '@/lib/server-auth';
import { hashPassword } from '@/lib/passwords';

// PUT /api/workspaces/[id]/users/[userId]/password - Change user password
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, userId } = await context.params;
    const body = await request.json();

    // Check if user has admin access
    if (authResult.user.role !== 'admin' && authResult.user.role !== 'developer') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { password } = body;

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if the user belongs to this workspace
    const userCheckResult = await db.query(`
      SELECT wu.user_id 
      FROM workspace_users wu
      WHERE wu.workspace_id = $1 AND wu.user_id = $2 AND wu.is_active = true
    `, [workspaceId, userId]);

    if (userCheckResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found in this workspace' }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = hashPassword(password);

    // Update the user's password
    await db.query(`
      UPDATE user_accounts 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `, [hashedPassword, userId]);

    // Log the password change in audit log (if you have audit logging)
    console.log(`Password changed for user ${userId} in workspace ${workspaceId} by admin ${authResult.user.email}`);

    return NextResponse.json({ 
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing user password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}