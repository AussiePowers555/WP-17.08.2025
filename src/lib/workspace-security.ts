/**
 * Workspace Security Layer
 * Ensures complete isolation between workspaces with multiple security checks
 */

import { cookies } from 'next/headers';
import { verifyToken } from './server-auth';
import { ensureDatabaseInitialized } from './database';

export interface WorkspaceContext {
  userId: string;
  email: string;
  role: 'admin' | 'developer' | 'client' | 'workspace_user' | 'lawyer' | 'rental_company';
  workspaceId: string | null;
  canAccessMainWorkspace: boolean;
  canSwitchWorkspaces: boolean;
}

/**
 * Get the current user's workspace context with security validation
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Ensure database is initialized before verifying token
    await ensureDatabaseInitialized();
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return null;
    }
    
    // Only admins and developers can access MAIN workspace or switch workspaces
    const isPrivileged = decoded.role === 'admin' || decoded.role === 'developer';
    
    return {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      workspaceId: decoded.workspaceId || null,
      canAccessMainWorkspace: isPrivileged,
      canSwitchWorkspaces: isPrivileged
    };
  } catch (error) {
    console.error('Error getting workspace context:', error);
    return null;
  }
}

/**
 * Validate that a user can access a specific workspace
 * @returns The validated workspace ID or throws an error
 */
export async function validateWorkspaceAccess(requestedWorkspaceId?: string): Promise<string> {
  const context = await getWorkspaceContext();
  
  if (!context) {
    throw new Error('Unauthorized: No valid session');
  }
  
  // For non-privileged users, they MUST have a workspace assigned
  if (!context.canAccessMainWorkspace && !context.workspaceId) {
    throw new Error('Unauthorized: No workspace assigned');
  }
  
  // If user requests a specific workspace
  if (requestedWorkspaceId) {
    // Privileged users can access any workspace
    if (context.canSwitchWorkspaces) {
      return requestedWorkspaceId;
    }
    
    // Non-privileged users can only access their assigned workspace
    if (requestedWorkspaceId !== context.workspaceId) {
      console.error(`Security violation: User ${context.email} attempted to access workspace ${requestedWorkspaceId} but is assigned to ${context.workspaceId}`);
      throw new Error('Forbidden: Cannot access this workspace');
    }
    
    return requestedWorkspaceId;
  }
  
  // No specific workspace requested - return user's default
  if (context.workspaceId) {
    return context.workspaceId;
  }
  
  // Only privileged users can access MAIN when no workspace specified
  if (context.canAccessMainWorkspace) {
    return 'MAIN';
  }
  
  throw new Error('Forbidden: No workspace access');
}

/**
 * Build a secure WHERE clause for database queries that enforces workspace isolation
 */
export function buildWorkspaceWhereClause(
  context: WorkspaceContext,
  tableAlias: string = 'c',
  workspaceColumn: string = 'workspace_id'
): { clause: string; params: any[] } {
  // Non-privileged users MUST filter by their workspace
  if (!context.canAccessMainWorkspace || context.workspaceId) {
    return {
      clause: `${tableAlias}.${workspaceColumn} = $1`,
      params: [context.workspaceId]
    };
  }
  
  // Privileged users in MAIN can see all (but still exclude deleted)
  return {
    clause: '1=1', // No workspace filter, but other filters still apply
    params: []
  };
}

/**
 * Validate that a case belongs to the user's workspace
 */
export async function validateCaseWorkspace(
  caseId: string,
  pool: any
): Promise<boolean> {
  const context = await getWorkspaceContext();
  
  if (!context) {
    return false;
  }
  
  // Privileged users can access any case
  if (context.canAccessMainWorkspace && !context.workspaceId) {
    return true;
  }
  
  // Check if case belongs to user's workspace
  const result = await pool.query(
    'SELECT 1 FROM cases WHERE id = $1 AND workspace_id = $2 AND (is_deleted = false OR is_deleted IS NULL)',
    [caseId, context.workspaceId]
  );
  
  return result.rows.length > 0;
}

/**
 * Log security events for audit trail
 */
export async function logSecurityEvent(
  eventType: 'access_denied' | 'workspace_violation' | 'unauthorized_query',
  details: Record<string, any>
): Promise<void> {
  const context = await getWorkspaceContext();
  
  console.error('[SECURITY EVENT]', {
    timestamp: new Date().toISOString(),
    eventType,
    user: context?.email || 'unknown',
    userId: context?.userId || 'unknown',
    workspaceId: context?.workspaceId || 'none',
    details
  });
  
  // In production, this should write to a security audit table
  // await pool.query(
  //   'INSERT INTO security_audit_log (event_type, user_id, details, timestamp) VALUES ($1, $2, $3, $4)',
  //   [eventType, context?.userId, JSON.stringify(details), new Date()]
  // );
}

/**
 * Middleware to validate workspace access for API routes
 */
export async function withWorkspaceSecurity<T>(
  handler: (context: WorkspaceContext) => Promise<T>
): Promise<T> {
  const context = await getWorkspaceContext();
  
  if (!context) {
    await logSecurityEvent('unauthorized_query', { 
      reason: 'No valid session' 
    });
    throw new Error('Unauthorized');
  }
  
  // For non-privileged users, ensure they have a workspace
  if (!context.canAccessMainWorkspace && !context.workspaceId) {
    await logSecurityEvent('workspace_violation', { 
      reason: 'User has no workspace assigned',
      email: context.email
    });
    throw new Error('No workspace assigned');
  }
  
  return handler(context);
}