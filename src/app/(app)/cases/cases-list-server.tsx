import { Suspense } from 'react';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import type { CaseFrontend } from '@/lib/database-schema';
import CasesListClient from './cases-list-client';

// Server component that fetches data at build time with ISR
export default async function CasesListServer() {
  // Ensure database is initialized
  await ensureDatabaseInitialized();
  
  // Fetch cases data at build time (will be cached for 5 minutes)
  const cases = await DatabaseService.getCasesAsync() as CaseFrontend[];
  const contacts = await DatabaseService.getContactsAsync();
  const workspaces = await DatabaseService.getWorkspacesAsync();

  return (
    <CasesListClient 
      initialCases={cases} 
      initialContacts={contacts}
      initialWorkspaces={workspaces}
    />
  );
}

// Loading skeleton component
export function CasesListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
      
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
      
      <div className="border rounded-lg">
        <div className="p-6">
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded" />
        </div>
        
        <div className="space-y-2 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border rounded">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}