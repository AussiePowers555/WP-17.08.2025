# Search Bar

## Component
Cases Search Input

## Location
Top section of cases list, below page header

## Icon
🔍 Search icon (magnifying glass)

## Placeholder Text
"Search cases..."

## Functionality
Real-time search across multiple case fields.

## Searchable Fields
- Case number
- Client name
- Client email
- Client phone
- At-fault party name
- Assigned lawyer name
- Assigned rental company
- Status

## Search Behavior
- **Type**: Real-time filtering (no submit needed)
- **Debounce**: Immediate (no delay)
- **Case Sensitivity**: Case-insensitive
- **Partial Matching**: Supports partial text matches

## Technical Implementation
```typescript
// Search logic
const filteredCases = cases.filter(case => 
  case.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
  case.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  case.clientEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  // ... other fields
);
```

## User Experience
- Instant results as user types
- Clear button (X) appears when text is entered
- Maintains search query during session
- Results update without page refresh

## Performance
- Client-side filtering for instant response
- No server round-trips needed
- Efficient for datasets up to 10,000 cases

## Keyboard Shortcuts
- `Ctrl/Cmd + F`: Focus search bar
- `Escape`: Clear search
- `Enter`: No action (real-time search)