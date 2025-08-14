# Application Documentation

## Overview
This documentation provides comprehensive information about each page, feature, and button in the WhitePointer bike rental management application. Use these docs to understand functionality before making changes or adding features.

## Documentation Structure

```
docs/
├── README.md (this file)
└── pages/
    ├── dashboard/           # Main dashboard documentation
    │   ├── README.md       # Dashboard overview
    │   └── *.md           # Individual button/feature docs
    ├── cases/              # Cases management documentation  
    │   ├── README.md      # Cases overview
    │   └── *.md          # Individual button/feature docs
    ├── fleet/             # Fleet management documentation
    │   ├── README.md     # Fleet overview
    │   └── *.md         # Individual button/feature docs
    └── [other pages]/    # Additional page documentation
```

## How to Use This Documentation

### Before Adding a Feature
1. Read the relevant page's README.md
2. Check existing button/feature documentation
3. Understand the current data flow
4. Review related pages that might be affected

### Before Modifying a Feature
1. Read the specific feature's .md file
2. Understand current functionality
3. Check for dependencies in related pages
4. Review business rules and validation

### When Creating New Features
1. Follow the existing documentation pattern
2. Create a new .md file for each button/feature
3. Update the page's README.md
4. Link related documentation

## Page Documentation

### Core Pages
- [Dashboard](./pages/dashboard/README.md) - System overview and metrics
- [Cases](./pages/cases/README.md) - Case management system
- [Fleet](./pages/fleet/README.md) - Bike inventory management

### Management Pages
- [Workspaces](./pages/workspaces/README.md) - Multi-tenant workspace system
- [Contacts](./pages/contacts/README.md) - Lawyers, companies, service centers
- [Documents](./pages/documents/README.md) - Document management

### Admin Pages
- [Admin Dashboard](./pages/admin/README.md) - Administrative controls
- [Settings](./pages/settings/README.md) - System configuration
- [Users](./pages/admin/users/README.md) - User management

### Financial Pages
- [Financials](./pages/financials/README.md) - Revenue tracking
- [Subscriptions](./pages/subscriptions/README.md) - Subscription management
- [Insurance](./pages/insurance/README.md) - Insurance tracking

### Other Pages
- [Authentication](./pages/auth/README.md) - Login/signup flows
- [Interactions](./pages/interactions/README.md) - Activity feed
- [Commitments](./pages/commitments/README.md) - Task management

## Documentation Standards

### Page README Structure
1. **Overview** - Brief description
2. **Page Location** - File paths and routes
3. **Main Features** - Key functionality
4. **Data Management** - How data flows
5. **Technical Details** - Implementation notes
6. **Related Pages** - Cross-references

### Button/Feature Documentation Structure
1. **Component** - Component name
2. **Location** - Where to find it
3. **Icon** - Visual identifier
4. **Functionality** - What it does
5. **Technical Details** - How it works
6. **Business Rules** - Constraints and logic
7. **Error Handling** - Error scenarios

## Updating Documentation

### When to Update
- After adding new features
- After modifying existing functionality
- When fixing bugs that change behavior
- When discovering undocumented features

### How to Update
1. Keep descriptions concise and clear
2. Include code snippets where helpful
3. Document business rules explicitly
4. Link to related documentation
5. Note any gotchas or edge cases

## Quick Reference

### Common Actions
- **Creating Records**: See new-[entity]-button.md files
- **Editing Records**: See edit-[entity]-button.md files
- **Deleting Records**: See delete-[entity]-button.md files
- **Search/Filter**: See search-bar.md and filter documentation

### State Management
- **Authentication**: Context-based (AuthContext)
- **Workspace**: Context-based (WorkspaceContext)
- **Local Storage**: User preferences
- **Session Storage**: Temporary state

### API Patterns
- **GET**: Fetch data
- **POST**: Create records
- **PUT/PATCH**: Update records
- **DELETE**: Remove records

## Contributing to Documentation

When adding new documentation:
1. Follow existing naming conventions
2. Use clear, descriptive titles
3. Include practical examples
4. Cross-reference related docs
5. Keep technical jargon minimal

## Need Help?

- Check page-specific README files first
- Look for button/feature-specific documentation
- Review related pages for context
- Consult CLAUDE.md for development commands