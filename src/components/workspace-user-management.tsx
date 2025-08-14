'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  Shield, 
  UserX,
  Copy,
  Users,
  ShieldCheck,
  UserCog,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { EnhancedCredentialsModal } from '@/components/enhanced-credentials-modal';

interface WorkspaceUser {
  id: string;
  user_id: string;
  workspace_id: string;
  role: 'admin' | 'developer' | 'client';
  display_name?: string;
  name: string;
  email: string;
  user_status: string;
  last_login?: string;
  joined_at?: string;
  invited_by_email?: string;
  is_active: boolean;
}

interface WorkspaceUserManagementProps {
  workspaceId: string;
  workspaceName: string;
  currentUserRole?: string;
  onClose?: () => void;
}

export function WorkspaceUserManagement({ 
  workspaceId, 
  workspaceName,
  currentUserRole,
  onClose 
}: WorkspaceUserManagementProps) {
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newUserCredentials, setNewUserCredentials] = useState<any>(null);
  
  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    display_name: '',
    password: '',
    role: 'client' as 'admin' | 'developer' | 'client',
    send_email: false
  });
  const [showPassword, setShowPassword] = useState(false);

  // Fetch workspace users
  useEffect(() => {
    fetchUsers();
  }, [workspaceId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workspaces/${workspaceId}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load workspace users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.display_name || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsAddingUser(true);
      const response = await fetch(`/api/workspaces/${workspaceId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          display_name: newUser.display_name,
          role: newUser.role,
          password: newUser.password,
          send_email: newUser.send_email
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add user');
      }

      const data = await response.json();
      
      // Show credentials modal
      setNewUserCredentials({
        email: data.credentials.email,
        password: data.credentials.password,
        url: data.credentials.loginUrl,
        name: newUser.display_name,
        workspace: workspaceName
      });
      setShowCredentialsModal(true);
      
      // Reset form and refresh users
      setNewUser({ email: '', display_name: '', password: '', role: 'client', send_email: false });
      setShowPassword(false);
      setShowAddDialog(false);
      fetchUsers();
      
      toast.success('User added successfully');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add user');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...updates })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      fetchUsers();
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the workspace?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/users?userId=${userId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove user');
      }

      fetchUsers();
      toast.success('User removed successfully');
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'developer':
        return 'default';
      case 'client':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-3 w-3" />;
      case 'developer':
        return <UserCog className="h-3 w-3" />;
      case 'client':
        return <Users className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const canManageUsers = currentUserRole === 'admin' || currentUserRole === 'developer';

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users for {workspaceName}
              </CardDescription>
            </div>
            {canManageUsers && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add User to Workspace</DialogTitle>
                    <DialogDescription>
                      Add a new user or invite an existing user to this workspace.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        placeholder="John Doe"
                        value={newUser.display_name}
                        onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password (min 6 characters)"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser({ 
                          ...newUser, 
                          role: value as 'admin' | 'developer' | 'client' 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="send_email"
                        checked={newUser.send_email}
                        onCheckedChange={(checked) => 
                          setNewUser({ ...newUser, send_email: checked as boolean })
                        }
                      />
                      <Label 
                        htmlFor="send_email" 
                        className="text-sm font-normal cursor-pointer"
                      >
                        Send credentials via email (optional)
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser} disabled={isAddingUser}>
                      {isAddingUser ? 'Adding...' : 'Add User'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading users...</div>
            </div>
          ) : (
            <Table>
              <TableCaption>
                {users.length} user{users.length !== 1 ? 's' : ''} in this workspace
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">
                      {user.name || user.display_name || user.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.email}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(user.email);
                            toast.success('Email copied to clipboard');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeColor(user.role)} className="gap-1">
                        {getRoleIcon(user.role)}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.user_status === 'active' ? 'default' : 'secondary'}>
                        {user.user_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        new Date(user.last_login).toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    {canManageUsers && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                const newRole = prompt(
                                  'Select new role (admin, developer, client):',
                                  user.role
                                );
                                if (newRole && ['admin', 'developer', 'client'].includes(newRole)) {
                                  handleUpdateUser(user.user_id, { role: newRole });
                                }
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoveUser(user.user_id)}
                              className="text-destructive"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Credentials Modal */}
      {showCredentialsModal && newUserCredentials && (
        <EnhancedCredentialsModal
          isOpen={showCredentialsModal}
          onClose={() => {
            setShowCredentialsModal(false);
            setNewUserCredentials(null);
          }}
          credentials={[{
            email: newUserCredentials.email,
            password: newUserCredentials.password,
            url: newUserCredentials.url,
            name: newUserCredentials.name
          }]}
          workspace={newUserCredentials.workspace}
          onDistribute={async (method, notes) => {
            // Track distribution
            try {
              await fetch('/api/credentials/track-distribution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_email: newUserCredentials.email,
                  method,
                  notes,
                  workspace_id: workspaceId
                })
              });
            } catch (error) {
              console.error('Failed to track distribution:', error);
            }
          }}
        />
      )}
    </>
  );
}