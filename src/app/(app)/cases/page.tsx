
import { Suspense } from 'react';
import CasesListServer, { CasesListSkeleton } from './cases-list-server';
import CasesClientWrapper from './cases-client-wrapper';

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching completely

// Server component with dynamic rendering
export default function CasesPage() {
  return (
    <CasesClientWrapper>
      <Suspense fallback={<CasesListSkeleton />}>
        <CasesListServer />
      </Suspense>
    </CasesClientWrapper>
  );
}