# Return Bike Button

## Component
Bike Return Action

## Location
In each bike card's footer section

## Icon
🔧 Wrench icon

## Button Text
"Return Bike"

## Visual State
- **Enabled**: Yellow background when bike is assigned
- **Disabled**: Grayed out when bike is not assigned

## Functionality
Immediately returns an assigned bike to the available pool.

## Return Process
1. User clicks "Return Bike" button
2. Bike status changes to "available"
3. Assignment data is cleared
4. Location resets to "Main Warehouse"
5. Success toast appears

## No Confirmation Dialog
- Action is immediate
- No confirmation required
- Can be undone by reassigning

## Data Changes
```typescript
{
  status: 'available',
  assignment: '-',
  location: 'Main Warehouse',
  assignedCaseId: undefined,
  assignmentStartDate: undefined,
  assignmentEndDate: undefined
}
```

## Business Impact
- Stops rental cost accumulation
- Frees bike for new assignment
- Updates case to show no bike assigned
- Preserves rental history in case logs

## Visual Feedback
- Button becomes disabled immediately
- Status badge changes from "assigned" to "available"
- Assignment details disappear from card
- Running total calculation stops

## Use Cases
- Customer returns bike
- Case is closed
- Bike needs maintenance
- Assignment was made in error

## Related Actions
- [Assign Bike](./assign-bike-button.md)
- [Service Center Assignment](./service-center-dropdown.md)