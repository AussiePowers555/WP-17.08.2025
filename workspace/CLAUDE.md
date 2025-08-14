# CLAUDE.md - Workspace Feature Documentation

This file provides comprehensive guidance for working with the Workspace feature in the WhitePointer application.

## Overview

The Workspace feature is a multi-tenant architecture that allows organizations to manage their operations independently while sharing a common infrastructure. Each workspace acts as an isolated environment with its own users, cases, settings, and permissions.

## Quick Reference to Main CLAUDE.md

For general development guidelines, commands, and overall architecture, refer to:
- **Main CLAUDE.md**: [`../CLAUDE.md`](../CLAUDE.md)
- **Bug Management Protocol**: See main CLAUDE.md for bug tracking procedures
- **Development Commands**: See main CLAUDE.md for all npm scripts and testing commands
- **Deployment Workflow**: See main CLAUDE.md for Vercel deployment procedures

## Workspace Architecture

### Core Components

#### 1. Database Schema (`src/lib/postgres-schema.ts`)
```typescript
// Workspaces table
workspaces: {
  id: serial primary key
  name: varchar(255) NOT NULL
  domain: varchar(255) UNIQUE
  settings: jsonb DEFAULT '{}'
  subscription_status: varchar(50) DEFAULT 'trial'
  created_at: timestamp
  updated_at: timestamp
}

// Workspace Users junction table
workspace_users: {
  id: serial primary key
  workspace_id: integer REFERENCES workspaces(id)
  user_id: integer REFERENCES users(id)
  role: varchar(50) DEFAULT 'member'
  joined_at: timestamp
  UNIQUE(workspace_id, user_id)
}

// Workspace Cases junction table
workspace_cases: {
  workspace_id: integer REFERENCES workspaces(id)
  case_id: integer REFERENCES cases(id)
  PRIMARY KEY(workspace_id, case_id)
}
```

#### 2. Authentication & Authorization
- **Session Management**: JWT tokens include workspace context
- **Workspace Selection**: Stored in session and cookies
- **Permission Levels**:
  - `super_admin`: Full system access
  - `admin`: Workspace administration
  - `manager`: Case and user management
  - `member`: Standard user access

#### 3. Middleware (`middleware.ts`)
```typescript
// Workspace validation in protected routes
- Validates user has access to selected workspace
- Redirects to workspace selection if none selected
- Enforces workspace isolation for data access
```

### File Structure

```
workspace/
├── app/
│   └── workspaces/
│       ├── page.tsx                 # Workspace management UI
│       ├── [id]/
│       │   ├── page.tsx             # Individual workspace view
│       │   ├── settings/            # Workspace settings
│       │   └── users/               # User management
│       └── create/
│           └── page.tsx             # Create new workspace
├── api/
│   └── workspaces/
│       ├── create/
│       │   └── route.ts             # POST: Create workspace
│       ├── list/
│       │   └── route.ts             # GET: List user's workspaces
│       ├── share/
│       │   └── route.ts             # POST: Share cases between workspaces
│       └── [id]/
│           ├── route.ts             # GET/PUT/DELETE workspace
│           └── users/
│               └── route.ts         # Manage workspace users
├── components/
│   ├── workspace-switcher.tsx      # UI for switching workspaces
│   ├── workspace-user-management.tsx # User management interface
│   └── onboarding-wizard.tsx       # New workspace setup wizard
├── contexts/
│   └── WorkspaceContext.tsx        # React context for workspace state
└── docs/
    └── WORKSPACE_FUNCTIONALITY.md  # Detailed feature documentation
```

## API Endpoints

### Workspace Management

#### Create Workspace
```typescript
POST /api/workspaces/create
Body: {
  name: string
  domain?: string
}
Response: {
  workspace: Workspace
  message: string
}
```

#### List Workspaces
```typescript
GET /api/workspaces/list
Response: {
  workspaces: Workspace[]
  currentWorkspace?: number
}
```

#### Get/Update/Delete Workspace
```typescript
GET /api/workspaces/[id]
PUT /api/workspaces/[id]
DELETE /api/workspaces/[id]
```

#### Manage Workspace Users
```typescript
GET /api/workspaces/[id]/users
POST /api/workspaces/[id]/users
DELETE /api/workspaces/[id]/users/[userId]
PUT /api/workspaces/[id]/users/[userId] // Update role
```

#### Share Cases Between Workspaces
```typescript
POST /api/workspaces/share
Body: {
  caseIds: number[]
  targetWorkspaceId: number
}
```

## Core Functions

### Database Operations (`src/lib/database.ts`)

```typescript
// Get user's workspaces
async function getUserWorkspaces(userId: number): Promise<Workspace[]>

// Create new workspace
async function createWorkspace(data: {
  name: string
  domain?: string
  ownerId: number
}): Promise<Workspace>

// Add user to workspace
async function addUserToWorkspace(
  workspaceId: number,
  userId: number,
  role: string = 'member'
): Promise<void>

// Get workspace cases
async function getWorkspaceCases(
  workspaceId: number,
  filters?: CaseFilters
): Promise<Case[]>

// Share case with workspace
async function shareCaseWithWorkspace(
  caseId: number,
  workspaceId: number
): Promise<void>
```

### Session Management (`src/lib/auth.ts`, `src/lib/server-auth.ts`)

```typescript
// Set current workspace in session
async function setCurrentWorkspace(
  userId: number,
  workspaceId: number
): Promise<void>

// Get current workspace from session
async function getCurrentWorkspace(
  cookies: ReadonlyRequestCookies
): Promise<number | null>

// Validate workspace access
async function validateWorkspaceAccess(
  userId: number,
  workspaceId: number
): Promise<boolean>
```

## React Components

### WorkspaceSwitcher (`src/components/workspace-switcher.tsx`)
- Dropdown menu for switching between workspaces
- Shows current workspace name
- Quick access to workspace settings
- Create new workspace option

### WorkspaceUserManagement (`src/components/workspace-user-management.tsx`)
- List workspace users with roles
- Add/remove users
- Update user roles
- Bulk user operations

### OnboardingWizard (`src/components/onboarding-wizard.tsx`)
- Step-by-step workspace setup
- Initial user invitation
- Default settings configuration
- Integration setup

## Common Workflows

### 1. Creating a New Workspace
```typescript
// API call
const response = await fetch('/api/workspaces/create', {
  method: 'POST',
  body: JSON.stringify({
    name: 'New Workspace',
    domain: 'workspace-domain'
  })
});

// Automatically sets as current workspace
// Adds creator as admin
```

### 2. Switching Workspaces
```typescript
// Via API
await fetch('/api/auth/session', {
  method: 'POST',
  body: JSON.stringify({
    workspaceId: targetWorkspaceId
  })
});

// Updates session and refreshes UI
```

### 3. Adding Users to Workspace
```typescript
// Via API
await fetch(`/api/workspaces/${workspaceId}/users`, {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    role: 'member'
  })
});
```

### 4. Sharing Cases Between Workspaces
```typescript
// Via API
await fetch('/api/workspaces/share', {
  method: 'POST',
  body: JSON.stringify({
    caseIds: [1, 2, 3],
    targetWorkspaceId: 5
  })
});
```

## Testing Workspace Features

### Unit Tests
```bash
# Test workspace creation
npm test -- workspace.create

# Test user management
npm test -- workspace.users

# Test case sharing
npm test -- workspace.share
```

### E2E Tests (Playwright)
```bash
# Run workspace-specific tests
npx playwright test tests/workspace-*.spec.ts

# Test workspace switching
npx playwright test tests/workspace-switching.spec.ts

# Test user permissions
npx playwright test tests/workspace-permissions.spec.ts
```

## Security Considerations

### Data Isolation
- All queries filter by workspace_id
- Middleware enforces workspace boundaries
- Cross-workspace operations require explicit permissions

### Permission Checks
```typescript
// Example permission check
function canManageWorkspace(user: User, workspace: Workspace): boolean {
  return user.role === 'super_admin' || 
         (user.workspaceRole === 'admin' && user.workspaceId === workspace.id);
}
```

### Audit Logging
- All workspace operations are logged
- User actions tracked with workspace context
- Available in Admin > Activity Log

## Troubleshooting

### Common Issues

#### 1. User Can't Access Workspace
- Check `workspace_users` table for membership
- Verify user role permissions
- Check workspace subscription status

#### 2. Cases Not Showing in Workspace
- Verify `workspace_cases` junction table
- Check case visibility settings
- Ensure proper filtering in queries

#### 3. Workspace Switching Not Working
- Clear browser cookies
- Check session validity
- Verify workspace exists and user has access

### Debug Queries
```sql
-- Check user's workspaces
SELECT w.*, wu.role 
FROM workspaces w
JOIN workspace_users wu ON w.id = wu.workspace_id
WHERE wu.user_id = ?;

-- Check workspace cases
SELECT c.* 
FROM cases c
JOIN workspace_cases wc ON c.id = wc.case_id
WHERE wc.workspace_id = ?;

-- Check workspace users
SELECT u.*, wu.role, wu.joined_at
FROM users u
JOIN workspace_users wu ON u.id = wu.user_id
WHERE wu.workspace_id = ?;
```

## Environment Variables

Required for workspace features:
```env
# Multi-tenant configuration
ENABLE_WORKSPACES=true
DEFAULT_WORKSPACE_NAME="Main Workspace"
MAX_WORKSPACES_PER_USER=10

# Subscription settings
TRIAL_DURATION_DAYS=14
WORKSPACE_USER_LIMIT=50
```

## Migration Guide

### Setting Up Workspaces for Existing Installation
1. Run database migrations: `npm run migrate:workspaces`
2. Create default workspace: `npm run setup:default-workspace`
3. Migrate existing users: `npm run migrate:users-to-workspace`
4. Update environment variables
5. Deploy changes

## Related Documentation

- [`../CLAUDE.md`](../CLAUDE.md) - Main development guide
- [`WORKSPACE_FUNCTIONALITY.md`](./docs/WORKSPACE_FUNCTIONALITY.md) - Detailed functionality
- [`WORKSPACE_USER_MANAGEMENT_COMPLETE.md`](./docs/WORKSPACE_USER_MANAGEMENT_COMPLETE.md) - User management details
- [`workspace03authidea.md`](./docs/workspace03authidea.md) - Authentication implementation ideas

## Quick Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run test:workspaces       # Run workspace tests

# Database
npm run db:workspace:check    # Verify workspace tables
npm run db:workspace:seed     # Seed test workspaces

# Debugging
npm run workspace:users       # List workspace users
npm run workspace:cases       # List workspace cases
npm run workspace:validate    # Validate workspace setup
```

## Implementation Checklist

When implementing workspace features:
- [ ] Database schema includes workspace_id
- [ ] API routes filter by workspace
- [ ] UI shows workspace context
- [ ] Permissions checked at all levels
- [ ] Audit logging includes workspace
- [ ] Tests cover multi-workspace scenarios
- [ ] Documentation updated
- [ ] Migration scripts prepared

## Support

For workspace-specific issues:
1. Check this documentation
2. Review error logs with workspace context
3. Test in isolated workspace
4. Check database constraints
5. Verify permissions and roles

---

**Note**: This documentation is specific to the Workspace feature. For general development guidelines, bug tracking, and deployment procedures, always refer to the main [`../CLAUDE.md`](../CLAUDE.md) file.