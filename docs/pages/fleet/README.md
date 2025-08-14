# Fleet Management Page

## Overview
The Fleet Management page handles the entire bike inventory system, including bike assignments to cases, maintenance tracking, and availability management.

## Page Location
- **Path**: `/fleet`
- **File**: `src/app/(app)/fleet/page.tsx`
- **Components**:
  - `new-bike-form.tsx`
  - `assign-case-form.tsx`
  - Edit page: `/fleet/edit/[bikeId]`

## Main Features

### 1. Bike Inventory Display
Grid layout showing all bikes with:
- Bike image
- Make and model
- Registration details
- Current status badge
- Location information
- Daily rates (Rate A & Rate B)
- Assignment details if assigned

### 2. Bike Status Management
Status options:
- **Available** (green) - Ready for assignment
- **Assigned** (blue) - Currently with a customer
- **Maintenance** (orange) - At service center
- **Other** (custom statuses)

### 3. Financial Tracking
For assigned bikes:
- Days assigned counter
- Running total calculation
- Rate A total
- Rate B total
- Combined total cost

### 4. Assignment Features
- Assign bike to case
- Return bike from assignment
- Track assignment duration
- Calculate rental costs
- Delivery address display

### 5. Service Center Management
- Assign bike to service center
- Track maintenance status
- Service center dropdown selection
- Location updates

## Data Fields

### Bike Information
- Unique bike ID
- Make & Model
- Registration number
- Registration expiry date
- Image URL
- Location

### Pricing
- Daily Rate A (default $85)
- Daily Rate B (default $95)
- Total cost calculation

### Assignment Data
- Assigned case ID
- Case number
- Customer name
- Delivery address
- Start date
- End date (when returned)

## Key Actions

### Primary Actions
- **Add New Bike** - Create new bike entry
- **Edit Bike** - Modify bike details
- **Assign Bike** - Assign to a case
- **Return Bike** - Mark as available
- **Delete Bike** - Remove from fleet

### Secondary Actions
- **Import From Backup** - Bulk import bikes
- **Service Center Assignment** - Send for maintenance
- **Search** - Filter bikes by various criteria

## Technical Implementation
- **State Management**: React hooks with local state
- **Data Fetching**: Custom hooks (`useBikes`, `useCases`)
- **Real-time Updates**: Refetch on actions
- **Image Handling**: External URLs with placeholders
- **Cost Calculation**: Automatic based on dates

## Business Logic

### Assignment Rules
- Only available bikes can be assigned
- One bike per case maximum
- Assignment generates case linkage
- Return action clears all assignment data

### Rate Calculation
```typescript
Daily Cost = Rate A + Rate B
Total Cost = Daily Cost × Days Assigned
```

### Status Transitions
- Available → Assigned (via assign action)
- Assigned → Available (via return action)
- Any → Maintenance (via service center assignment)
- Maintenance → Available (via service center removal)

## Related Features
- [Cases Management](../cases/README.md)
- [Contacts (Service Centers)](../contacts/README.md)
- [Financial Tracking](../financials/README.md)