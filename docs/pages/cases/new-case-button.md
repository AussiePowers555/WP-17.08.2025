# New Case Button

## Component
Create New Case Action

## Location
Top-right corner of Cases page header

## Icon
➕ PlusCircle icon

## Button Text
"New Case"

## Functionality
Opens a modal dialog with the new case creation form.

## Form Fields
### Client Information
- Client Name (required)
- Client Phone
- Client Email
- Street Address
- Suburb
- State
- Postcode
- Claim Number
- Insurance Company

### At-Fault Party Information
- At-Fault Party Name (required)
- At-Fault Party Phone
- At-Fault Party Email
- Street Address
- Suburb
- State
- Postcode
- Claim Number
- Insurance Company

### Case Assignment
- Assigned Lawyer (dropdown)
- Assigned Rental Company (dropdown)
- Initial Status (defaults to "New Matter")

## Validation
- Client name is required
- At-fault party name is required
- Case number auto-generated (YYYY-XXX format)

## On Submit
1. Creates new case in database
2. Associates with current workspace
3. Sets initial status to "New Matter"
4. Generates unique case number
5. Redirects to case detail page
6. Shows success toast notification

## Error Handling
- Displays validation errors inline
- Shows error toast if creation fails
- Maintains form data on error

## Permissions
- Requires authenticated user
- Requires active workspace
- Admin and regular users can create cases