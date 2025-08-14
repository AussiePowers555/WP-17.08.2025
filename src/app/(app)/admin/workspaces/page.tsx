'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MoreVertical,
  Building2,
  Users,
  Settings,
  Trash2,
  UserPlus,
  Eye,
  Plus,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { WorkspaceUserManagement } from '@/components/workspace-user-management';
import { useAuth } from '@/context/AuthContext';

interface Contact {
  id: string;
  name: string;
  company?: string;
  type: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Workspace {
  id: string;
  name: string;
  contactId: string;
  type?: string;
  contact?: Contact;
  userCount?: number;
  caseCount?: number;
  createdAt?: string;
}

export default function WorkspacesPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    contactId: '',
    type: ''
  });

  useEffect(() => {
    fetchWorkspaces();
    fetchContacts();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workspaces/list');
      if (!response.ok) throw new Error('Failed to fetch workspaces');
      
      const data = await response.json();
      setWorkspaces(data.workspaces || []);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name || !newWorkspace.contactId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkspace)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create workspace');
      }

      const data = await response.json();
      
      toast.success('Workspace created successfully');
      setShowCreateDialog(false);
      setNewWorkspace({ name: '', contactId: '', type: '' });
      fetchWorkspaces();
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete workspace');
      }

      toast.success('Workspace deleted successfully');
      fetchWorkspaces();
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete workspace');
    }
  };

  const openUserManagement = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowUserManagement(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage workspaces and their users
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Create a new workspace and associate it with a contact.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Smith Lawyers Workspace"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Associated Contact</Label>
                <select
                  id="contact"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newWorkspace.contactId}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, contactId: e.target.value })}
                >
                  <option value="">Select a contact...</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.company && `(${contact.company})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type (Optional)</Label>
                <Input
                  id="type"
                  placeholder="e.g., Lawyer, Rental Company"
                  value={newWorkspace.type}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, type: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkspace} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Workspace'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading workspaces...</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {workspaces.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Workspaces</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Get started by creating your first workspace.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Workspace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Workspaces</CardTitle>
                <CardDescription>
                  {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Cases</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workspaces.map((workspace) => (
                      <TableRow key={workspace.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {workspace.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {workspace.contact ? (
                            <div>
                              <div className="font-medium">{workspace.contact.name}</div>
                              {workspace.contact.company && (
                                <div className="text-sm text-muted-foreground">
                                  {workspace.contact.company}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {workspace.type ? (
                            <Badge variant="outline">{workspace.type}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {workspace.userCount || 0} users
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {workspace.caseCount || 0} cases
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {workspace.createdAt ? (
                            new Date(workspace.createdAt).toLocaleDateString()
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openUserManagement(workspace)}>
                                <Users className="mr-2 h-4 w-4" />
                                User Management
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteWorkspace(workspace.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Workspace
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
    </div>
  );
}