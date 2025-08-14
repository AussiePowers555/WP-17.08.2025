
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStorage } from "@/hooks/use-session-storage";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWorkspaces, useContacts } from "@/hooks/use-database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Building, PlusCircle, MoreVertical, Edit, Trash2, Users, ArrowRight, Activity, Clock, UserPlus, Settings2, Briefcase, Scale, Car } from "lucide-react";
import type { WorkspaceFrontend as Workspace, ContactFrontend as Contact } from "@/lib/database-schema";
import { NewWorkspaceForm } from "./new-workspace-form";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceUserManagement } from '@/components/workspace-user-management';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const workspaceCategories: Contact['type'][] = ['Insurer', 'Lawyer', 'Rental Company'];

export default function WorkspacesPage() {
  const { user } = useAuth();
  const { data: workspaces, loading: workspacesLoading, error: workspacesError, create: createWorkspace, update: updateWorkspace, remove: deleteWorkspace } = useWorkspaces();
  const { data: contacts, loading: contactsLoading, error: contactsError } = useContacts();
  const { switchWorkspace } = useWorkspace();
  
  const [isClient, setIsClient] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);
  const [activeTab, setActiveTab] = useState<Contact['type']>('Rental Company');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFormSubmit = async (workspaceData: Omit<Workspace, 'id'> & { id?: string }) => {
    try {
      if (workspaceData.id) { // Edit mode
        const { id, ...data } = workspaceData;
        await updateWorkspace(id, data);
        toast({ title: "Workspace Updated", description: `"${workspaceData.name}" has been updated.` });
      } else { // Create mode
        await createWorkspace(workspaceData);
        toast({ title: "Workspace Created", description: `New workspace "${workspaceData.name}" has been created.` });
      }
      setIsFormOpen(false);
      setWorkspaceToEdit(null);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save workspace" 
      });
    }
  };
  
  const handleSelectWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    if (!workspace) return;

    const contact = contacts.find(c => c.id === workspace.contactId);
    if (!contact) {
        toast({ variant: "destructive", title: "Contact Not Found", description: "The contact assigned to this workspace no longer exists." });
        return;
    }

    // Check if this is the Main Workspace
    if (workspace.name === 'Main Workspace') {
        switchWorkspace('MAIN');
        toast({ title: "Switched to Main Workspace", description: "Now viewing all cases across all workspaces." });
    } else {
        switchWorkspace(workspace.id, workspace.name);
        toast({ title: "Workspace Activated", description: `Viewing cases for ${contact.name}.` });
    }
    
    router.push('/cases');
  }
  
  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      await deleteWorkspace(workspaceId);
      toast({ variant: "destructive", title: "Workspace Deleted" });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete workspace" 
      });
    }
  }

  const getWorkspacesForCategory = (category: Contact['type']) => {
    const contactIdsForCategory = contacts.filter(c => c.type === category).map(c => c.id);
    return workspaces.filter(ws => contactIdsForCategory.includes(ws.contactId));
  }

  const getContactForWorkspace = (workspace: Workspace) => {
    return contacts.find(c => c.id === workspace.contactId);
  }
  
  const openNewForm = () => {
    setWorkspaceToEdit(null);
    setIsFormOpen(true);
  }
  
  const openEditForm = (workspace: Workspace) => {
    setWorkspaceToEdit(workspace);
    setIsFormOpen(true);
  }

  const openUserManagement = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowUserManagement(true);
  }

  if (!isClient || workspacesLoading || contactsLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  if (workspacesError || contactsError) {
    return <div className="flex items-center justify-center h-64 text-destructive">Error loading data. Please refresh the page.</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                 <h1 className="text-2xl font-bold">Workspace Directory</h1>
                 <p className="text-muted-foreground">Manage and organize your workspaces for different companies and clients.</p>
            </div>
          <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Workspace
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Workspaces</p>
                            <p className="text-2xl font-bold">{workspaces.length}</p>
                        </div>
                        <Building className="h-8 w-8 text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Insurers</p>
                            <p className="text-2xl font-bold">{getWorkspacesForCategory('Insurer').length}</p>
                        </div>
                        <Briefcase className="h-8 w-8 text-green-500" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Lawyers</p>
                            <p className="text-2xl font-bold">{getWorkspacesForCategory('Lawyer').length}</p>
                        </div>
                        <Scale className="h-8 w-8 text-blue-500" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Rental Companies</p>
                            <p className="text-2xl font-bold">{getWorkspacesForCategory('Rental Company').length}</p>
                        </div>
                        <Car className="h-8 w-8 text-purple-500" />
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Your Workspaces</CardTitle>
                <CardDescription>
                Select a workspace to enter, or manage workspace settings and users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Main Workspace - Special Section */}
                {workspaces.find(ws => ws.name === 'Main Workspace') && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">GLOBAL VIEW</h3>
                    <Card 
                      className="group cursor-pointer transition-all hover:shadow-lg border-2 border-primary/20 hover:border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10"
                      onClick={() => handleSelectWorkspace(workspaces.find(ws => ws.name === 'Main Workspace')!.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Building className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">Main Workspace</h4>
                              <p className="text-sm text-muted-foreground">View and manage all cases across all workspaces</p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Contact['type'])} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="Insurer">Insurers</TabsTrigger>
                        <TabsTrigger value="Lawyer">Lawyers</TabsTrigger>
                        <TabsTrigger value="Rental Company">Rental Companies</TabsTrigger>
                    </TabsList>
                    
                    {workspaceCategories.map(category => (
                        <TabsContent key={category} value={category}>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {getWorkspacesForCategory(category).map(ws => {
                                    const contact = getContactForWorkspace(ws);
                                    return (
                                        <Card 
                                            key={ws.id} 
                                            className="group transition-all hover:shadow-lg border-border"
                                        >
                                            <CardContent className="p-0">
                                                <div 
                                                    className="p-6 cursor-pointer"
                                                    onClick={() => handleSelectWorkspace(ws.id)}
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                                                category === 'Insurer' && "bg-green-100",
                                                                category === 'Lawyer' && "bg-blue-100",
                                                                category === 'Rental Company' && "bg-purple-100"
                                                            )}>
                                                                {category === 'Insurer' && <Briefcase className="h-5 w-5 text-green-600" />}
                                                                {category === 'Lawyer' && <Scale className="h-5 w-5 text-blue-600" />}
                                                                {category === 'Rental Company' && <Car className="h-5 w-5 text-purple-600" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold">{ws.name}</h4>
                                                                <p className="text-sm text-muted-foreground">{contact?.name || "No contact assigned"}</p>
                                                            </div>
                                                        </div>
                                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Activity className="h-3 w-3" />
                                                            <span>Active</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>Last accessed today</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border-t px-4 py-2 bg-muted/30 flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openUserManagement(ws);
                                                        }}
                                                    >
                                                        <Users className="mr-1 h-3 w-3" /> Users
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditForm(ws);
                                                        }}
                                                    >
                                                        <Settings2 className="mr-1 h-3 w-3" /> Settings
                                                    </Button>
                                                <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                        <MoreVertical className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete the workspace.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteWorkspace(ws.id)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                                </DropdownMenu>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                            {getWorkspacesForCategory(category).length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>No workspaces found for this category.</p>
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
      </div>

       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{workspaceToEdit ? "Edit Workspace" : "Create New Workspace"}</DialogTitle>
                    <DialogDescription>
                        {workspaceToEdit ? "Update the details for your workspace." : "Workspaces help you organize different parts of your business."}
                    </DialogDescription>
                </DialogHeader>
                <NewWorkspaceForm 
                    contacts={contacts} 
                    onSubmit={handleFormSubmit}
                    setDialogOpen={setIsFormOpen}
                    workspaceToEdit={workspaceToEdit}
                    activeCategory={activeTab}
                />
            </DialogContent>
        </Dialog>

        {/* User Management Dialog */}
        <Dialog open={showUserManagement} onOpenChange={setShowUserManagement}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Workspace User Management</DialogTitle>
              <DialogDescription>
                Manage users for {selectedWorkspace?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedWorkspace && (
              <WorkspaceUserManagement
                workspaceId={selectedWorkspace.id}
                workspaceName={selectedWorkspace.name}
                currentUserRole={user?.role}
                onClose={() => setShowUserManagement(false)}
              />
            )}
          </DialogContent>
        </Dialog>
    </>
  );
}
