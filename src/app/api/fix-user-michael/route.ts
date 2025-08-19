import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseInitialized, db } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '@/lib/passwords';

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    if (!db) {
      throw new Error('Database not initialized');
    }

    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      const userEmail = 'michaelalanwilson@outlook.com';
      
      // Check if user exists
      const userCheck = await client.query(
        'SELECT id FROM user_accounts WHERE email = $1',
        [userEmail]
      );
      
      let userId;
      
      if (userCheck.rows.length === 0) {
        // Create user if doesn't exist
        userId = uuidv4();
        const hashedPassword = hashPassword('Client123!'); // Default password
        
        await client.query(`
          INSERT INTO user_accounts (id, email, password_hash, role, status, workspace_id)
          VALUES ($1, $2, $3, $4, $5, NULL)
        `, [userId, userEmail, hashedPassword, 'client', 'active']);
        
        console.log(`Created user: ${userEmail}`);
      } else {
        userId = userCheck.rows[0].id;
        
        // Update existing user to be a client with no default workspace
        await client.query(`
          UPDATE user_accounts 
          SET role = 'client', 
              status = 'active',
              workspace_id = NULL
          WHERE id = $1
        `, [userId]);
        
        console.log(`Updated user role to client: ${userEmail}`);
      }
      
      // Check if Dave workspace exists
      const workspaceCheck = await client.query(
        "SELECT id FROM workspaces WHERE LOWER(name) = 'dave'"
      );
      
      let workspaceId;
      
      if (workspaceCheck.rows.length === 0) {
        // Create Dave workspace if it doesn't exist
        workspaceId = uuidv4();
        await client.query(`
          INSERT INTO workspaces (id, name, type, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [workspaceId, 'Dave', 'client', 'active']);
        
        console.log('Created Dave workspace');
      } else {
        workspaceId = workspaceCheck.rows[0].id;
      }
      
      // Remove user from all workspaces first
      await client.query(`
        UPDATE workspace_users 
        SET is_active = false, removed_at = NOW()
        WHERE user_id = $1
      `, [userId]);
      
      // Check if user is already in Dave workspace
      const membershipCheck = await client.query(
        'SELECT id FROM workspace_users WHERE workspace_id = $1 AND user_id = $2',
        [workspaceId, userId]
      );
      
      if (membershipCheck.rows.length === 0) {
        // Add user to Dave workspace
        await client.query(`
          INSERT INTO workspace_users (id, workspace_id, user_id, role, display_name, joined_at, is_active)
          VALUES ($1, $2, $3, $4, $5, NOW(), true)
        `, [uuidv4(), workspaceId, userId, 'client', 'Michael Wilson']);
      } else {
        // Reactivate membership if exists
        await client.query(`
          UPDATE workspace_users 
          SET is_active = true, 
              role = 'client',
              display_name = 'Michael Wilson',
              removed_at = NULL,
              joined_at = NOW()
          WHERE workspace_id = $1 AND user_id = $2
        `, [workspaceId, userId]);
      }
      
      // Now make sure the user can only see cases from Dave workspace
      // First, get all cases currently in Dave workspace
      const casesInDave = await client.query(
        'SELECT id FROM cases WHERE workspace_id = $1 AND status != $2 LIMIT 2',
        [workspaceId, 'deleted']
      );
      
      // If there aren't 2 cases in Dave workspace, we need to either move or create them
      if (casesInDave.rows.length < 2) {
        // Get any 2 active cases to assign to Dave workspace
        const anyCases = await client.query(
          'SELECT id FROM cases WHERE status != $1 LIMIT 2',
          ['deleted']
        );
        
        if (anyCases.rows.length > 0) {
          // Assign these cases to Dave workspace
          const caseIds = anyCases.rows.map(row => row.id);
          await client.query(
            'UPDATE cases SET workspace_id = $1 WHERE id = ANY($2)',
            [workspaceId, caseIds]
          );
          console.log(`Assigned ${caseIds.length} cases to Dave workspace`);
        }
      }
      
      await client.query('COMMIT');
      
      // Get final configuration
      const finalUser = await client.query(`
        SELECT 
          u.id,
          u.email,
          u.role,
          u.status,
          u.workspace_id,
          wu.workspace_id as assigned_workspace_id,
          wu.role as workspace_role,
          wu.display_name,
          w.name as workspace_name
        FROM user_accounts u
        LEFT JOIN workspace_users wu ON u.id = wu.user_id AND wu.is_active = true
        LEFT JOIN workspaces w ON wu.workspace_id = w.id
        WHERE u.email = $1
      `, [userEmail]);
      
      const caseCount = await client.query(
        'SELECT COUNT(*) as count FROM cases WHERE workspace_id = $1 AND status != $2',
        [workspaceId, 'deleted']
      );
      
      return NextResponse.json({
        success: true,
        message: 'User configuration fixed successfully',
        user: finalUser.rows[0],
        workspaceId: workspaceId,
        casesInWorkspace: caseCount.rows[0].count,
        changes: [
          `User ${userEmail} set as client role`,
          'User removed from all workspaces except Dave',
          'User added to Dave workspace as client',
          `Dave workspace has ${caseCount.rows[0].count} cases`
        ]
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error fixing user configuration:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}