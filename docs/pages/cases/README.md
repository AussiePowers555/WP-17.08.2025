# Cases Page

## Overview
The Cases page is the central hub for managing bike rental cases, tracking customer claims, and coordinating with lawyers and insurance companies.

## Page Location
- **Path**: `/cases`
- **File**: `src/app/(app)/cases/page.tsx`
- **Components**:
  - `cases-list-client.tsx`
  - `cases-list-server.tsx`
  - `cases-client-wrapper.tsx`
  - `new-case-form.tsx`

## Main Features

### 1. Cases List Display
Two view modes available:
- **Explorer View**: Windows-style file explorer interface
- **Table View**: Traditional data table layout

### 2. Case Management
- Create new cases
- Edit existing cases
- Delete cases
- Search and filter cases
- Sort by various fields

### 3. Case Details
Each case displays:
- Case number
- Client information
- At-fault party details
- Assigned lawyer
- Assigned rental company
- Current status
- Last update timestamp

### 4. Status Workflow
Predefined status options:
- New Matter
- Customer Contacted
- Awaiting Approval
- Bike Delivered
- Bike Returned
- Demands Sent
- Awaiting Settlement
- Settlement Agreed
- Paid
- Closed

## Data Management

### Workspace Integration
- Cases are workspace-specific
- Shared cases between workspaces
- Role-based access control

### Contact Association
- Links to lawyers
- Links to rental companies
- Links to service centers

## Search & Filter Capabilities
- Real-time search across all case fields
- Status-based filtering
- Date range filtering
- Workspace filtering

## Sorting Options
- Case number
- Client name
- Last updated
- Status

## Technical Details
- **State Management**: React hooks (useState, useEffect)
- **Data Fetching**: Server-side with client hydration
- **Storage**: Session storage for user preferences
- **Database**: PostgreSQL with optimized queries

## Related Pages
- [Case Detail](./case-detail/README.md)
- [Fleet Management](../fleet/README.md)
- [Contacts](../contacts/README.md)