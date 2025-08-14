'use server';

import { db, ensureDatabaseInitialized } from '@/lib/database';
import { revalidatePath, revalidateTag } from 'next/cache';
import { 
  InteractionFeedView, 
  CreateInteractionData, 
  UpdateInteractionData, 
  InteractionFilters, 
  InteractionSortOptions,
  PaginatedInteractions 
} from '@/types/interaction';
import { 
  getWorkspaceContext, 
  validateWorkspaceAccess,
  buildWorkspaceWhereClause,
  validateCaseWorkspace,
  logSecurityEvent,
  withWorkspaceSecurity
} from '@/lib/workspace-security';

/**
 * SECURE VERSION: Get paginated interactions with enforced workspace isolation
 */
export async function getInteractionsSecure(
  page: number = 1,
  limit: number = 20,
  filters: InteractionFilters = {},
  sort: InteractionSortOptions = { field: 'timestamp', direction: 'desc' },
  workspaceIdFilter?: string // Optional workspace filter for admins viewing specific workspaces
): Promise<{ success: boolean; data?: PaginatedInteractions; error?: string }> {
  return withWorkspaceSecurity(async (context) => {
    try {
      await ensureDatabaseInitialized();
      
      const offset = (page - 1) * limit;
      
      // Build WHERE clauses with security
      const whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      // CRITICAL: Always filter out deleted cases
      whereConditions.push('(c.is_deleted = false OR c.is_deleted IS NULL)');
      
      // CRITICAL: Apply workspace security filter
      // If admin provides a specific workspace filter, use that
      // Otherwise apply standard security based on user context
      if (workspaceIdFilter && context.canAccessMainWorkspace) {
        // Admin viewing a specific workspace
        whereConditions.push(`c.workspace_id = $${paramIndex++}`);
        queryParams.push(workspaceIdFilter);
      } else {
        // Apply standard workspace security
        const workspaceSecurity = buildWorkspaceWhereClause(context, 'c', 'workspace_id');
        if (workspaceSecurity.clause !== '1=1') {
          whereConditions.push(workspaceSecurity.clause);
          queryParams.push(...workspaceSecurity.params);
          paramIndex += workspaceSecurity.params.length;
        }
      }
      
      // Log access attempt for audit
      console.log('[SECURE QUERY] User:', context.email, 'User Workspace:', context.workspaceId, 'Viewing Workspace:', workspaceIdFilter || 'ALL', 'Filters:', filters);
      
      // Add user-provided filters
      if (filters.caseNumber) {
        whereConditions.push(`i.case_number ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.caseNumber}%`);
      }
      
      if (filters.caseId) {
        // Validate that user can access this case
        const canAccess = await validateCaseWorkspace(filters.caseId, db);
        if (!canAccess) {
          await logSecurityEvent('access_denied', {
            caseId: filters.caseId,
            reason: 'Case not in user workspace'
          });
          return { 
            success: false, 
            error: 'Access denied: Case not found' 
          };
        }
        whereConditions.push(`i.case_id = $${paramIndex++}`);
        queryParams.push(filters.caseId);
      }
      
      // Add other filters...
      if (filters.interactionType && filters.interactionType.length > 0) {
        whereConditions.push(`i.interaction_type = ANY($${paramIndex++})`);
        queryParams.push(filters.interactionType);
      }
      
      if (filters.priority && filters.priority.length > 0) {
        whereConditions.push(`i.priority = ANY($${paramIndex++})`);
        queryParams.push(filters.priority);
      }
      
      if (filters.status && filters.status.length > 0) {
        whereConditions.push(`i.status = ANY($${paramIndex++})`);
        queryParams.push(filters.status);
      }
      
      if (filters.dateFrom) {
        whereConditions.push(`i.timestamp >= $${paramIndex++}`);
        queryParams.push(filters.dateFrom);
      }
      
      if (filters.dateTo) {
        whereConditions.push(`i.timestamp <= $${paramIndex++}`);
        queryParams.push(filters.dateTo);
      }
      
      const whereClause = 'WHERE ' + whereConditions.join(' AND ');
      
      // Build ORDER BY clause (validate sort field to prevent SQL injection)
      const validSortFields = ['timestamp', 'case_number', 'priority', 'status'];
      const sortField = validSortFields.includes(sort.field) ? sort.field : 'timestamp';
      const sortDirection = sort.direction === 'asc' ? 'ASC' : 'DESC';
      const orderBy = `ORDER BY i.${sortField} ${sortDirection}`;
      
      // Main query with security filters
      const query = `
        SELECT 
          i.id,
          i.case_number as "caseNumber",
          i.case_id as "caseId",
          i.interaction_type as "interactionType",
          i.timestamp,
          i.contact_name as "contactName",
          i.contact_phone as "contactPhone",
          i.contact_email as "contactEmail",
          i.situation,
          i.action_taken as "actionTaken",
          i.outcome,
          i.priority,
          i.status,
          i.tags,
          i.attachments,
          i.created_by as "createdBy",
          i.updated_by as "updatedBy",
          i.created_at as "createdAt",
          i.updated_at as "updatedAt",
          i.workspace_id as "workspaceId",
          c.client_name as "caseHirerName",
          c.accident_date as "incidentDate",
          c.status as "caseStatus",
          c.client_insurance_company as "insuranceCompany",
          c.lawyer as "lawyerAssigned",
          c.rental_company as "rentalCompany"
        FROM interactions i
        INNER JOIN cases c ON i.case_id = c.id
        ${whereClause}
        ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      
      queryParams.push(limit + 1, offset);
      
      const result = await db.query(query, queryParams);
      const interactions = result.rows || [];
      const hasMore = interactions.length > limit;
      
      if (hasMore) {
        interactions.pop();
      }
      
      // Get total count with same security filters
      const countQuery = `
        SELECT COUNT(*) as total
        FROM interactions i
        INNER JOIN cases c ON i.case_id = c.id
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, queryParams.slice(0, -2));
      const totalCount = parseInt(countResult.rows[0]?.total || '0');
      
      return {
        success: true,
        data: {
          interactions: interactions as InteractionFeedView[],
          totalCount,
          hasMore,
          nextCursor: hasMore ? (page + 1).toString() : undefined
        }
      };
    } catch (error) {
      await logSecurityEvent('unauthorized_query', {
        error: error instanceof Error ? error.message : 'Unknown error',
        page,
        filters
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch interactions' 
      };
    }
  });
}

/**
 * SECURE VERSION: Create interaction with workspace validation
 */
export async function createInteractionSecure(
  data: CreateInteractionData
): Promise<{ success: boolean; data?: any; error?: string }> {
  return withWorkspaceSecurity(async (context) => {
    try {
      await ensureDatabaseInitialized();
      
      // Validate that the case belongs to user's workspace
      const caseResult = await db.query(
        'SELECT id, workspace_id FROM cases WHERE case_number = $1 AND (is_deleted = false OR is_deleted IS NULL)',
        [data.caseNumber]
      );
      
      const caseInfo = caseResult.rows[0];
      if (!caseInfo) {
        return { success: false, error: 'Case not found' };
      }
      
      // Security check: Ensure case is in user's workspace
      if (!context.canAccessMainWorkspace && caseInfo.workspace_id !== context.workspaceId) {
        await logSecurityEvent('workspace_violation', {
          attemptedCase: data.caseNumber,
          caseWorkspace: caseInfo.workspace_id,
          userWorkspace: context.workspaceId
        });
        return { success: false, error: 'Access denied' };
      }
      
      // Create interaction with validated workspace
      const query = `
        INSERT INTO interactions (
          case_id, case_number, interaction_type, contact_name, 
          situation, action_taken, outcome, priority, status, 
          workspace_id, created_by, timestamp, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        )
        RETURNING *
      `;
      
      const params = [
        caseInfo.id,
        data.caseNumber,
        data.interactionType,
        data.contactName || null,
        data.situation,
        data.actionTaken,
        data.outcome,
        data.priority || 'medium',
        data.status || 'completed',
        caseInfo.workspace_id, // Use case's workspace, not user input
        context.userId,
        data.timestamp || new Date()
      ];
      
      const result = await db.query(query, params);
      const interaction = result.rows[0];
      
      // Revalidate caches
      revalidatePath('/interactions');
      revalidateTag('interactions');
      revalidateTag(`case-${data.caseId}`);
      
      return { success: true, data: interaction };
    } catch (error) {
      await logSecurityEvent('unauthorized_query', {
        action: 'create_interaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create interaction' 
      };
    }
  });
}

/**
 * SECURE VERSION: Update interaction with ownership validation
 */
export async function updateInteractionSecure(
  data: UpdateInteractionData
): Promise<{ success: boolean; data?: any; error?: string }> {
  return withWorkspaceSecurity(async (context) => {
    try {
      await ensureDatabaseInitialized();
      
      // First verify the interaction exists and user has access
      const checkQuery = `
        SELECT i.*, c.workspace_id 
        FROM interactions i
        INNER JOIN cases c ON i.case_id = c.id
        WHERE i.id = $1 AND (c.is_deleted = false OR c.is_deleted IS NULL)
      `;
      
      const checkResult = await db.query(checkQuery, [data.id]);
      const existing = checkResult.rows[0];
      
      if (!existing) {
        return { success: false, error: 'Interaction not found' };
      }
      
      // Security check: Ensure interaction's case is in user's workspace
      if (!context.canAccessMainWorkspace && existing.workspace_id !== context.workspaceId) {
        await logSecurityEvent('workspace_violation', {
          action: 'update_interaction',
          interactionId: data.id,
          interactionWorkspace: existing.workspace_id,
          userWorkspace: context.workspaceId
        });
        return { success: false, error: 'Access denied' };
      }
      
      // Build update query dynamically based on provided fields
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Only allow updating specific fields
      const allowedFields = [
        'interactionType', 'contactName', 'contactPhone', 'contactEmail',
        'situation', 'actionTaken', 'outcome', 'priority', 'status', 'tags'
      ];
      
      for (const field of allowedFields) {
        if (data[field as keyof UpdateInteractionData] !== undefined) {
          const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
          updateFields.push(`${dbField} = $${paramIndex++}`);
          values.push(data[field as keyof UpdateInteractionData]);
        }
      }
      
      if (updateFields.length === 0) {
        return { success: false, error: 'No valid fields to update' };
      }
      
      updateFields.push(`updated_by = $${paramIndex++}`);
      values.push(context.userId);
      updateFields.push(`updated_at = NOW()`);
      
      values.push(data.id);
      
      const updateQuery = `
        UPDATE interactions 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await db.query(updateQuery, values);
      const updated = result.rows[0];
      
      // Revalidate caches
      revalidatePath('/interactions');
      revalidateTag('interactions');
      revalidateTag(`interaction-${data.id}`);
      
      return { success: true, data: updated };
    } catch (error) {
      await logSecurityEvent('unauthorized_query', {
        action: 'update_interaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update interaction' 
      };
    }
  });
}

/**
 * SECURE VERSION: Delete interaction with ownership validation
 */
export async function deleteInteractionSecure(
  interactionId: number
): Promise<{ success: boolean; error?: string }> {
  return withWorkspaceSecurity(async (context) => {
    try {
      await ensureDatabaseInitialized();
      
      // Verify ownership before deletion
      const checkQuery = `
        SELECT i.*, c.workspace_id 
        FROM interactions i
        INNER JOIN cases c ON i.case_id = c.id
        WHERE i.id = $1
      `;
      
      const checkResult = await db.query(checkQuery, [interactionId]);
      const existing = checkResult.rows[0];
      
      if (!existing) {
        return { success: false, error: 'Interaction not found' };
      }
      
      // Security check
      if (!context.canAccessMainWorkspace && existing.workspace_id !== context.workspaceId) {
        await logSecurityEvent('workspace_violation', {
          action: 'delete_interaction',
          interactionId,
          interactionWorkspace: existing.workspace_id,
          userWorkspace: context.workspaceId
        });
        return { success: false, error: 'Access denied' };
      }
      
      // Perform deletion
      await db.query('DELETE FROM interactions WHERE id = $1', [interactionId]);
      
      // Revalidate caches
      revalidatePath('/interactions');
      revalidateTag('interactions');
      revalidateTag(`interaction-${interactionId}`);
      
      return { success: true };
    } catch (error) {
      await logSecurityEvent('unauthorized_query', {
        action: 'delete_interaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete interaction' 
      };
    }
  });
}