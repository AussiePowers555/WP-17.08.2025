import CasesListClassic from "./cases-list-classic";
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { ContactFrontend, WorkspaceFrontend } from '@/lib/database-schema';

async function getCasesData() {
  await ensureDatabaseInitialized();
  const [cases, contacts, workspaces] = await Promise.all([
    DatabaseService.getAllCases(),
    DatabaseService.getAllContacts() as Promise<ContactFrontend[]>,
    DatabaseService.getAllWorkspaces() as Promise<WorkspaceFrontend[]>,
  ]);
  return { cases, contacts, workspaces };
}

export default async function CasesClassicPage() {
  const { cases, contacts, workspaces } = await getCasesData();
  
  return (
    <CasesListClassic 
      initialCases={cases} 
      initialContacts={contacts}
      initialWorkspaces={workspaces}
    />
  );
}