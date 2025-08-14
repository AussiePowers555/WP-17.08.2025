# View Toggle Button

## Component
View Mode Switcher

## Location
Top-right of cases list, near search bar

## Icons
- 📊 LayoutGrid - Explorer view
- 📋 TableProperties - Table view

## Current States
- Active view highlighted with primary color
- Inactive view shown in muted color

## Functionality
Toggles between two display modes for cases list.

## View Modes

### Explorer View (Default)
- Windows Explorer-style interface
- Folder/file metaphor
- Visual hierarchy with icons
- Expandable case details
- Better for visual scanning

### Table View
- Traditional data table
- Compact row display
- All data visible at once
- Better for bulk operations
- Sortable columns

## State Persistence
- View preference saved in session storage
- Maintained during navigation
- Reset on new session

## Technical Details
```typescript
const [viewMode, setViewMode] = useState<'explorer' | 'table'>('explorer');
```

## Accessibility
- Keyboard navigable
- ARIA labels for screen readers
- Clear visual feedback

## Performance Impact
- Explorer view: Better for <100 cases
- Table view: Better for >100 cases
- Both views use virtualization for large datasets