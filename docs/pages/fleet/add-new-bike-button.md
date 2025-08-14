# Add New Bike Button

## Component
Create New Bike Action

## Location
Top-right corner of Fleet page header

## Icon
➕ PlusCircle icon

## Button Text
"Add New Bike"

## Functionality
Navigates to the new bike creation form page.

## Navigation
- **Route**: `/fleet/new`
- **Method**: Client-side navigation using Next.js router

## New Bike Form Fields

### Basic Information
- **Make** (required) - Manufacturer name
- **Model** (required) - Bike model
- **Registration** (required) - License plate number
- **Registration Expires** - Expiry date picker

### Pricing
- **Daily Rate A** - Default $85/day
- **Daily Rate B** - Default $95/day

### Location & Status
- **Location** - Default "Main Warehouse"
- **Status** - Default "available"
- **Image URL** - Optional bike photo

## Validation Rules
- Make is required
- Model is required
- Registration must be unique
- Rates must be positive numbers

## On Submit
1. Validates all required fields
2. Creates bike entry in database
3. Sets initial status to "available"
4. Sets location to "Main Warehouse"
5. Redirects back to fleet page
6. Shows success toast notification

## Error Handling
- Inline validation messages
- Duplicate registration check
- Network error recovery
- Form data persistence on error

## User Permissions
- Requires authenticated user
- Admin and regular users can add bikes
- Workspace context required