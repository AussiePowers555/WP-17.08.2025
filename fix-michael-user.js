const { Pool } = require('pg');
const crypto = require('crypto');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Generate UUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function fixMichaelUser() {
  const client = await pool.connect();
  
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
      const hashedPassword = hashPassword('Client123!');
      
      await client.query(`
        INSERT INTO user_accounts (id, email, password_hash, role, status, workspace_id)
        VALUES ($1, $2, $3, $4, $5, NULL)
      `, [userId, userEmail, hashedPassword, 'client', 'active']);
      
      console.log(`✅ Created user: ${userEmail}`);
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
      
      console.log(`✅ Updated user role to client: ${userEmail}`);
    }
    
    // Check if Dave workspace exists
    const workspaceCheck = await client.query(
      "SELECT id, contact_id FROM workspaces WHERE LOWER(name) = 'dave'"
    );
    
    let workspaceId;
    let contactId;
    
    if (workspaceCheck.rows.length === 0) {
      // First check if there's a contact named Dave
      const contactCheck = await client.query(
        "SELECT id FROM contacts WHERE LOWER(name) LIKE '%dave%' LIMIT 1"
      );
      
      if (contactCheck.rows.length === 0) {
        // Create a contact for Dave workspace
        contactId = uuidv4();
        await client.query(`
          INSERT INTO contacts (id, name, type, email, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [contactId, 'Dave', 'Client', 'dave@example.com']);
        console.log('✅ Created Dave contact');
      } else {
        contactId = contactCheck.rows[0].id;
        console.log('✅ Found existing contact for Dave');
      }
      
      // Create Dave workspace with contact_id
      workspaceId = uuidv4();
      await client.query(`
        INSERT INTO workspaces (id, name, contact_id, type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [workspaceId, 'Dave', contactId, 'client']);
      
      console.log('✅ Created Dave workspace');
    } else {
      workspaceId = workspaceCheck.rows[0].id;
      contactId = workspaceCheck.rows[0].contact_id;
      console.log('✅ Found existing Dave workspace');
    }
    
    // Remove user from all workspaces first
    await client.query(`
      UPDATE workspace_users 
      SET is_active = false, removed_at = NOW()
      WHERE user_id = $1
    `, [userId]);
    
    console.log('✅ Removed user from all existing workspaces');
    
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
      console.log('✅ Added user to Dave workspace');
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
      console.log('✅ Reactivated user membership in Dave workspace');
    }
    
    // Get all active cases not in Dave workspace and limit to 2
    const casesToMove = await client.query(`
      SELECT id, case_number, client_name 
      FROM cases 
      WHERE status != 'deleted' 
        AND (workspace_id IS NULL OR workspace_id != $1)
      ORDER BY created_at DESC
      LIMIT 2
    `, [workspaceId]);
    
    if (casesToMove.rows.length > 0) {
      // Move these cases to Dave workspace
      const caseIds = casesToMove.rows.map(row => row.id);
      await client.query(
        'UPDATE cases SET workspace_id = $1 WHERE id = ANY($2)',
        [workspaceId, caseIds]
      );
      console.log(`✅ Moved ${casesToMove.rows.length} cases to Dave workspace:`);
      casesToMove.rows.forEach(c => {
        console.log(`   - Case #${c.case_number}: ${c.client_name}`);
      });
    } else {
      console.log('⚠️ No cases available to move to Dave workspace');
    }
    
    // Count total cases in Dave workspace
    const caseCount = await client.query(
      'SELECT COUNT(*) as count FROM cases WHERE workspace_id = $1 AND status != $2',
      [workspaceId, 'deleted']
    );
    
    await client.query('COMMIT');
    
    // Get final configuration
    const finalUser = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        u.workspace_id as default_workspace,
        wu.workspace_id as assigned_workspace_id,
        wu.role as workspace_role,
        wu.display_name,
        w.name as workspace_name
      FROM user_accounts u
      LEFT JOIN workspace_users wu ON u.id = wu.user_id AND wu.is_active = true
      LEFT JOIN workspaces w ON wu.workspace_id = w.id
      WHERE u.email = $1
    `, [userEmail]);
    
    console.log('\n========================================');
    console.log('✅ USER CONFIGURATION FIXED SUCCESSFULLY');
    console.log('========================================');
    console.log('\n📋 Final Configuration:');
    console.log('  Email:', finalUser.rows[0].email);
    console.log('  Role:', finalUser.rows[0].role);
    console.log('  Status:', finalUser.rows[0].status);
    console.log('  Default Workspace:', finalUser.rows[0].default_workspace || 'None');
    console.log('  Assigned Workspace:', finalUser.rows[0].workspace_name);
    console.log('  Workspace Role:', finalUser.rows[0].workspace_role);
    console.log('  Display Name:', finalUser.rows[0].display_name);
    console.log(`  Cases in Dave workspace: ${caseCount.rows[0].count}`);
    console.log('\n✅ User can now log in as a client with access to Dave workspace only');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing user configuration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixMichaelUser()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });