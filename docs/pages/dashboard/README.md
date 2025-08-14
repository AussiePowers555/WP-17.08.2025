# Dashboard Page

## Overview
The main dashboard provides a comprehensive overview of the bike rental case management system. It displays key metrics, recent cases, and system status at a glance.

## Page Location
- **Path**: `/` (app root)
- **File**: `src/app/(app)/page.tsx`
- **Components**: 
  - `dashboard-client.tsx`
  - `dashboard-stats-server.tsx`

## Main Features

### 1. Dashboard Statistics
Real-time metrics displaying:
- Total active cases
- Fleet utilization rate
- Revenue tracking
- Pending tasks

### 2. Recent Cases Table
Shows the 4 most recently updated cases with:
- Case number
- Client name
- Assigned lawyer
- Assigned rental company
- Current status
- Last update timestamp

### 3. Status Indicators
Visual badges showing case status:
- **New Matter** (outline badge)
- **Closed/Paid** (default badge)
- **Demands Sent/Awaiting Settlement** (destructive/red badge)
- **Other statuses** (secondary badge)

## Data Flow
1. Server-side data fetching using `DatabaseService`
2. Streaming SSR with Suspense boundaries
3. Automatic loading skeletons during data fetch
4. Real-time updates on page refresh

## Technical Implementation
- **Rendering**: Force dynamic rendering (`export const dynamic = 'force-dynamic'`)
- **Database**: PostgreSQL via Neon
- **Loading States**: Skeleton components for progressive enhancement
- **Error Handling**: Graceful fallbacks for database connection issues

## Key Components

### RecentCasesServer
- Fetches and displays recent cases
- Sorts by last update time
- Maps contact IDs to names
- Applies status-based styling

### DashboardStatsServer
- Aggregates system metrics
- Calculates fleet utilization
- Tracks financial data

## User Permissions
- Requires authenticated user session
- Shows workspace-specific data
- Admin users see all workspaces

## Related Pages
- [Cases Management](../cases/README.md)
- [Fleet Management](../fleet/README.md)
- [Financial Overview](../financials/README.md)