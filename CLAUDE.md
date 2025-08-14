# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- **Start development server**: `npm run dev` (runs on port 3000 with Turbopack)
- **Build for production**: `npm run build`
- **Start production server**: `npm start` or `npm run start:prod`
- **Run linting**: `npm run lint`
- **Fix linting issues**: `npm run lint:fix`
- **Run type checking**: `npm run typecheck`
- **Full test suite**: `npm run test:full` (runs lint + typecheck)

### Testing
- **Run E2E tests**: `npm run test:e2e` (Playwright tests)
- **Run tests with UI**: `npm run test:e2e:ui`
- **Run specific test**: `npx playwright test tests/[test-file].spec.ts`

### Database & Health Checks
- **Check database health**: `npm run db:health`
- **Setup PostgreSQL**: `npm run setup:postgresql`
- **Verify PostgreSQL**: `npm run verify:postgresql`

### External Testing with Cloudflare Tunnel
- **Start tunnel**: `npm run tunnel` or `cloudflared tunnel --url http://localhost:3000`
- **Setup tunnel URL**: `npm run tunnel:setup` or `node setup-cloudflare-url.js https://your-url.trycloudflare.com`
- **Setup local IP**: `npm run setup-local-ip`
- **Auto-restart dev server**: `npm run dev:auto-restart` (for env changes)

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.3.3 with TypeScript
- **Database**: PostgreSQL (Neon) via `pg` driver
- **Authentication**: Custom JWT-based auth in `src/lib/auth.ts`
- **UI Components**: Radix UI primitives with custom components in `src/components/ui/`
- **Styling**: Tailwind CSS with class-variance-authority
- **Email**: Nodemailer for email service
- **PDF Generation**: pdf-lib and pdfkit
- **Forms**: JotForm integration for external forms
- **Payment**: Stripe integration

### Project Structure
```
src/
├── app/                      # Next.js App Router pages and API routes
│   ├── (app)/               # Authenticated app pages
│   │   ├── cases/           # Case management system
│   │   ├── fleet/           # Bike fleet management
│   │   ├── workspaces/      # Workspace management
│   │   └── admin/           # Admin dashboard
│   ├── (auth)/              # Auth-related pages
│   ├── api/                 # API endpoints
│   └── forms/               # External form pages
├── components/              # Reusable React components
├── contexts/                # React contexts (Auth, Workspace)
├── lib/                     # Core utilities and services
│   ├── database.ts          # Database connection and queries
│   ├── auth.ts              # Authentication utilities
│   ├── email-service.ts     # Email functionality
│   └── pdf-generator.ts     # PDF generation
└── types/                   # TypeScript type definitions
```

### Key Services

#### Database (`src/lib/database.ts`, `src/lib/postgres-db.ts`)
- Connection pooling with `pg.Pool`
- Schema defined in `src/lib/postgres-schema.ts`
- Migrations in `src/lib/database/migrations/`

#### Authentication (`src/lib/auth.ts`, `src/lib/server-auth.ts`)
- JWT-based session management
- Password hashing with bcryptjs
- Session validation middleware

#### Case Management System
- Core functionality in `src/app/(app)/cases/`
- Document management and signature workflows
- Integration with JotForm for external forms

#### Workspace System
- Multi-tenant architecture with workspace isolation
- User management per workspace
- Shared cases between workspaces

## Deployment Workflow

### Vercel Production Deployment
```bash
# After testing locally
git add -A
git commit -m "fix: [description]"
git push origin master
vercel --prod
```

### Pre-deployment Checklist
- ✅ TypeScript errors resolved: `npm run typecheck`
- ✅ Linting passes: `npm run lint`
- ✅ Local testing confirms fix
- ✅ Environment variables updated in Vercel if needed

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `JWT_SECRET`: Secret for JWT signing
- `NEXT_PUBLIC_BASE_URL`: Base URL for the application
- `STRIPE_SECRET_KEY`: Stripe API key (if using payments)
- `JOTFORM_API_KEY`: JotForm API key (if using forms)

## Bug Management Protocol

### Automated Bug Workflow
1. **Scan bug_report.md** on startup for open bugs
2. **Fix and test** bugs using Playwright tests
3. **Auto-deploy** to Vercel after local tests pass
4. **Track all changes** in bug_report.md with timestamps

### Bug Fix Process
```bash
# Fix bug locally
# Run tests
npm run test:e2e

# If tests pass, deploy
git add -A
git commit -m "fix: [bug description] - Bug ID: [id]"
git push origin master
vercel --prod
```

All bug tracking entries signed as "Claude Code Terminal" with date/time.

## Feature Documentation

### IMPORTANT: Read Before Making Changes
Comprehensive documentation for all pages and features is available in the `docs/` directory. **Always consult this documentation before editing or adding features.**

### Documentation Structure
```
docs/
├── README.md                 # Main documentation index
└── pages/
    ├── dashboard/           # Dashboard page documentation
    ├── cases/              # Cases management documentation
    ├── fleet/              # Fleet management documentation
    ├── workspaces/         # Workspace system documentation
    ├── admin/              # Admin features documentation
    └── [other pages]/      # Additional page documentation
```

### How to Use Feature Documentation

#### Before Editing Features
1. **Read the page documentation**: `docs/pages/[page-name]/README.md`
2. **Check button/feature docs**: `docs/pages/[page-name]/[feature-name].md`
3. **Understand data flow**: Review technical implementation sections
4. **Check related pages**: Follow cross-references to understand impact

#### When Adding New Features
1. **Study existing patterns**: Read similar feature documentation
2. **Follow conventions**: Match existing UI/UX patterns
3. **Document new features**: Create new .md files for additions
4. **Update page README**: Add new features to overview

#### Documentation Updates
- **Update docs when**: Adding features, changing functionality, fixing bugs
- **Keep docs current**: Documentation should reflect actual implementation
- **Use for context**: Reference docs in todo lists and planning

### Quick Links to Key Documentation
- [Application Overview](./docs/README.md)
- [Dashboard Features](./docs/pages/dashboard/README.md)
- [Cases Management](./docs/pages/cases/README.md)
- [Fleet Management](./docs/pages/fleet/README.md)

## Standard Development Workflow

1. **Research & Planning**
   - Read relevant documentation in `docs/pages/`
   - Understand existing features and patterns
   - Write a detailed plan with todo items
   - **IMPORTANT: Present the complete plan to the user**
   - **You MUST ask: "Do you approve this plan?"**
   - **Wait for the user to type "yes" before proceeding to implementation**
   - **Never start coding without explicit approval**

2. **Implementation** (Only after user approval)
   - Follow existing code conventions
   - Keep changes simple and focused
   - Mark todos complete as you progress

3. **Documentation**
   - Update relevant .md files in `docs/`
   - Document new buttons/features added
   - Keep documentation accurate

4. **Review**
   - Verify changes match documentation
   - Ensure all todos are complete
   - Add summary of changes made