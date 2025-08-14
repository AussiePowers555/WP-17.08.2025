'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, MailIcon, KeyRound, Users } from 'lucide-react';
import UserCreateForm from './user-create-form';
import { BulkUserCreation } from '@/components/bulk-user-creation';
import { EnhancedCredentialsModal } from '@/components/enhanced-credentials-modal';
import { useSafeDate } from '@/lib/date-utils';

// Component to handle date formatting safely
function UserDates({ createdAt, lastLogin }: { createdAt: string; lastLogin?: string }) {
  const createdDate = useSafeDate(createdAt, 'date');
  const lastLoginDate = useSafeDate(lastLogin, 'date');
  
  return (
    <div className="text-sm text-muted-foreground">
      Created: {createdDate}
      {lastLogin && (
        <span className="ml-4">
          Last login: {lastLoginDate}
        </span>
      )}
    </div>
  );
}

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  workspace_id?: string;
  contact_id?: string;
  created_at: string;
  last_login?: string;
}

type WorkspaceCredentials = {
  contactName: string;
  workspaceName: string;
  username: string;
  tempPassword: string;
  contactEmail: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkCreateForm, setShowBulkCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [displayCredentials, setDisplayCredentials] = useState<{
    username: string;
    password: string;
    email?: string;
    workspaceName?: string;
    workspaceId?: string;
  } | null>(null);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to get auth headers
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const currentUserStr = sessionStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    
    if (currentUser) {
      headers['x-user-id'] = currentUser.id;
      headers['x-user-email'] = currentUser.email;
    }
    
    return headers;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      console.log('Fetching users with headers:', headers);
      
      const response = await fetch('/api/users', {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserCreated = () => {
    setShowCreateForm(false);
    fetchUsers();
  };

  const handleBulkCreateComplete = () => {
    setShowBulkCreateForm(false);
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        alert('User deleted successfully');
        fetchUsers();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      alert('Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  const handleGeneratePassword = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(user.id)}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'generate-temp-password' }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate temporary password');
      }
      // Open modal with returned password
      setDisplayCredentials({
        username: user.email,
        password: data.tempPassword,
        email: user.email,
        workspaceName: user.workspace_id || 'General User',
        workspaceId: user.workspace_id
      });
      setCredentialsModalOpen(true);
      // refresh list to show status change (pending_password_change)
      fetchUsers();
    } catch (e) {
      console.error('Generate temp password failed', e);
      alert(e instanceof Error ? e.message : 'Failed to generate password');
    }
  };

  const handleEditUser = async (user: User, updates: Partial<User>) => {
    try {
      console.log(`Updating user ${user.email} with:`, updates);
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        // Show success message with the actual updated role
        alert(data.message || `User ${user.email} updated successfully`);
        console.log('User update response:', data);
        fetchUsers();
        setEditingUser(null);
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch (err) {
      alert('Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  const handleResendCredentials = async (user: User) => {
    try {
      // Try server email first
      const response = await fetch('/api/users/send-credentials', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: user.email,
          // Indicate that a reset is required; server may ignore without Brevo key
          password: 'RESET_PASSWORD_REQUIRED',
          role: user.role
        }),
        credentials: 'include'
      });
      const data = await response.json().catch(() => ({ success: false }));

      if (data?.success) {
        alert('Credentials email sent successfully');
        return;
      }

      // Fallback: generate a temp password now and show modal so admin can copy/share
      const gen = await fetch(`/api/users/${encodeURIComponent(user.id)}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'generate-temp-password' }),
        credentials: 'include'
      });
      const genData = await gen.json();

      if (!genData.success) {
        throw new Error(genData.error || 'Failed to generate temporary password');
      }

      setDisplayCredentials({
        username: user.email,
        password: genData.tempPassword,
        email: user.email,
        workspaceName: user.workspace_id || 'General User',
        workspaceId: user.workspace_id
      });
      setCredentialsModalOpen(true);
    } catch (err) {
      console.error('Error sending or generating credentials:', err);
      alert('Failed to send credentials. Generated password fallback also failed.');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'developer': return 'bg-purple-100 text-purple-800';
      case 'lawyer': return 'bg-blue-100 text-blue-800';
      case 'rental_company': return 'bg-green-100 text-green-800';
      case 'workspace_user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_password_change': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'deleted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions for the PBike Rescue system
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateForm(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add User
          </Button>
          <Button onClick={() => setShowBulkCreateForm(true)} variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Bulk Create
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Bulk Creation Form */}
      {showBulkCreateForm && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Bulk User Creation</CardTitle>
                <CardDescription>
                  Create multiple user accounts at once with automatic password generation
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowBulkCreateForm(false)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <BulkUserCreation 
              onComplete={handleBulkCreateComplete}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>
            Find users by email address or role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No users found matching your search.' : 'No users found.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{user.email}</h3>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <UserDates createdAt={user.created_at} lastLogin={user.last_login} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendCredentials(user)}
                      disabled={!user.email}
                      title={!user.email ? 'No email on file' : undefined}
                    >
                      <MailIcon className="w-4 h-4 mr-1" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGeneratePassword(user)}
                    >
                      <KeyRound className="w-4 h-4 mr-1" />
                      Generate Password
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {showCreateForm && (
        <UserCreateForm
          onClose={() => setShowCreateForm(false)}
          onUserCreated={handleUserCreated}
        />
      )}

      <EnhancedCredentialsModal
        open={credentialsModalOpen}
        onOpenChange={setCredentialsModalOpen}
        credentials={displayCredentials}
        onDistributed={(method, notes) => {
          console.log(`Credentials distributed via ${method}`, notes);
          // Here you could make an API call to track distribution
        }}
      />

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
              <CardDescription>Update user details for {editingUser.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleEditUser(editingUser, {
                  role: formData.get('role') as string,
                  status: formData.get('status') as string,
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    name="role"
                    defaultValue={editingUser.role}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="admin">Admin</option>
                    <option value="developer">Developer</option>
                    <option value="lawyer">Lawyer</option>
                    <option value="rental_company">Rental Company</option>
                    <option value="workspace_user">Workspace User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    name="status"
                    defaultValue={editingUser.status}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="pending_password_change">Pending Password Change</option>
                    <option value="suspended">Suspended</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}