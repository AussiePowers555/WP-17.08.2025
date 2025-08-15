import { Suspense } from 'react';
import CasesListServer, { CasesListSkeleton } from '../cases/cases-list-server';
import CasesClientWrapper from '../cases/cases-client-wrapper';

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching completely
export const fetchCache = 'force-no-store'; // Force no caching at all

// Server component with dynamic rendering
export default function CasesExplorerPage() {
  return (
    <CasesClientWrapper>
      <Suspense fallback={<CasesListSkeleton />}>
        <CasesListServer />
      </Suspense>
    </CasesClientWrapper>
  );
}