# Refresh Button

## Component
Dashboard Refresh Action

## Location
Top-right corner of dashboard statistics cards

## Icon
🔄 (Refresh/Reload icon)

## Functionality
Triggers a full page refresh to fetch latest data from the database.

## Technical Details
- **Action**: Browser page reload
- **Method**: `window.location.reload()` or router refresh
- **Data Impact**: Re-fetches all dashboard metrics and recent cases

## When to Use
- When real-time data is needed
- After making changes in other sections
- To verify system synchronization

## User Experience
- Shows loading skeletons during refresh
- Maintains scroll position after reload
- Updates all metrics simultaneously

## Performance Notes
- Full page refresh may take 1-2 seconds
- Utilizes streaming SSR for faster perceived load
- Database queries are optimized with indexes