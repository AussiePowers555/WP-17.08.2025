# Assign Bike Button

## Component
Bike Assignment Action

## Location
In each bike card's footer section

## Icon
📦 PackageCheck icon

## Button Text
"Assign Bike"

## Visual State
- **Enabled**: Green background when bike is available
- **Disabled**: Grayed out when bike is already assigned or in maintenance

## Functionality
Opens a modal dialog to assign the bike to an existing case.

## Assignment Dialog

### Dialog Header
Shows bike model and ID being assigned

### Form Fields
- **Select Case** (required) - Dropdown of unassigned cases
- **Start Date** - Assignment start date (defaults to today)

### Case Dropdown Details
- Shows case number
- Shows client name
- Filters out cases that already have bikes
- Sorted by case number

## Assignment Process
1. User clicks "Assign Bike" button
2. Modal opens with case selection
3. User selects target case
4. Optional: User adjusts start date
5. Confirms assignment

## On Assignment
1. Updates bike status to "assigned"
2. Links bike to case ID
3. Sets assignment start date
4. Updates bike location to "On-road"
5. Redirects to case detail page
6. Shows success toast

## Business Rules
- Only available bikes can be assigned
- Each case can only have one bike
- Assignment creates bidirectional link
- Start date cannot be in future

## Data Updates
```typescript
{
  status: 'assigned',
  assignment: caseNumber,
  location: 'On-road',
  assignedCaseId: caseId,
  assignmentStartDate: startDate
}
```

## Error Scenarios
- No available cases
- Network failure
- Database conflict
- Invalid date selection

## Related Actions
- [Return Bike](./return-bike-button.md)
- [Edit Bike](./edit-bike-button.md)