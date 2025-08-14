'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspaces, useContacts } from '@/hooks/use-database';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building,
  ChevronDown,
  Search,
  Plus,
  Check,
  Clock,
  Users,
  Home,
  Briefcase,
  Scale,
  Car,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkspaceFrontend as Workspace, ContactFrontend as Contact } from '@/lib/database-schema';

interface WorkspaceSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function WorkspaceSwitcher({ className, showLabel = true }: WorkspaceSwitcherProps) {
  const { user } = useAuth();
  const { id: currentWorkspaceId, name: currentWorkspaceName, switchWorkspace } = useWorkspace();
  const { data: workspaces, loading: workspacesLoading } = useWorkspaces();
  const { data: contacts } = useContacts();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load recent workspaces from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentWorkspaces');
    if (stored) {
      setRecentWorkspaces(JSON.parse(stored));
    }
  }, []);

  // Update recent workspaces when switching
  const updateRecentWorkspaces = (workspaceId: string) => {
    const updated = [
      workspaceId,
      ...recentWorkspaces.filter(id => id !== workspaceId)
    ].slice(0, 5); // Keep only 5 most recent
    
    setRecentWorkspaces(updated);
    localStorage.setItem('recentWorkspaces', JSON.stringify(updated));
  };

  // Get contact for workspace
  const getContactForWorkspace = (workspace: Workspace) => {
    return contacts.find(c => c.id === workspace.contactId);
  };

  // Get workspace type icon
  const getWorkspaceIcon = (contact?: Contact) => {
    if (!contact) return <Building className="h-4 w-4" />;
    
    switch (contact.type) {
      case 'Lawyer':
        return <Scale className="h-4 w-4" />;
      case 'Insurer':
        return <Briefcase className="h-4 w-4" />;
      case 'Rental Company':
        return <Car className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  // Get workspace color based on type
  const getWorkspaceColor = (contact?: Contact) => {
    if (!contact) return 'bg-gray-500';
    
    switch (contact.type) {
      case 'Lawyer':
        return 'bg-blue-500';
      case 'Insurer':
        return 'bg-green-500';
      case 'Rental Company':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Filter workspaces based on search
  const filteredWorkspaces = workspaces.filter(ws => {
    if (!searchQuery) return true;
    
    const contact = getContactForWorkspace(ws);
    const searchLower = searchQuery.toLowerCase();
    
    return (
      ws.name.toLowerCase().includes(searchLower) ||
      contact?.name.toLowerCase().includes(searchLower) ||
      contact?.type.toLowerCase().includes(searchLower)
    );
  });

  // Group workspaces
  const mainWorkspace = workspaces.find(ws => ws.name === 'Main Workspace');
  const recentWorkspaceObjects = recentWorkspaces
    .map(id => workspaces.find(ws => ws.id === id))
    .filter(Boolean) as Workspace[];
  const otherWorkspaces = filteredWorkspaces.filter(
    ws => ws.name !== 'Main Workspace' && !recentWorkspaces.includes(ws.id)
  );

  const handleSelectWorkspace = (workspace: Workspace) => {
    const contact = getContactForWorkspace(workspace);
    
    if (workspace.name === 'Main Workspace') {
      switchWorkspace('MAIN');
      toast({
        title: "Switched to Main Workspace",
        description: "Viewing all cases across all workspaces",
      });
    } else {
      switchWorkspace(workspace.id, workspace.name);
      updateRecentWorkspaces(workspace.id);
      toast({
        title: "Workspace Switched",
        description: `Now viewing ${contact?.name || workspace.name}`,
      });
    }
    
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateWorkspace = () => {
    setIsOpen(false);
    router.push('/workspaces?action=new');
  };

  const handleManageWorkspaces = () => {
    setIsOpen(false);
    router.push('/workspaces');
  };

  // Get current workspace display info
  const isMainWorkspace = !currentWorkspaceId || currentWorkspaceId === 'MAIN';
  const currentWorkspace = isMainWorkspace 
    ? mainWorkspace 
    : workspaces.find(ws => ws.id === currentWorkspaceId);
  const currentContact = currentWorkspace ? getContactForWorkspace(currentWorkspace) : undefined;

  if (workspacesLoading) {
    return (
      <Button variant="ghost" className={cn("justify-between", className)} disabled>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse bg-muted rounded" />
          <span className="animate-pulse bg-muted rounded h-4 w-20" />
        </div>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "justify-between gap-2 px-3",
            "hover:bg-accent hover:text-accent-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className={cn(getWorkspaceColor(currentContact), "text-white")}>
                {isMainWorkspace ? (
                  <Home className="h-3 w-3" />
                ) : (
                  getWorkspaceIcon(currentContact)
                )}
              </AvatarFallback>
            </Avatar>
            {showLabel && (
              <span className="max-w-[150px] truncate font-medium">
                {isMainWorkspace ? 'Main Workspace' : currentWorkspace?.name || 'Select Workspace'}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel className="pb-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Main Workspace */}
        {mainWorkspace && (!searchQuery || 'main workspace'.includes(searchQuery.toLowerCase())) && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => handleSelectWorkspace(mainWorkspace)}
                className={cn(
                  "flex items-center gap-2 py-2",
                  isMainWorkspace && "bg-accent"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-gray-500 text-white">
                    <Home className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">Main Workspace</div>
                  <div className="text-xs text-muted-foreground">View all cases</div>
                </div>
                {isMainWorkspace && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Recent Workspaces */}
        {!searchQuery && recentWorkspaceObjects.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Recent
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {recentWorkspaceObjects.map(workspace => {
                const contact = getContactForWorkspace(workspace);
                const isActive = workspace.id === currentWorkspaceId;
                
                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => handleSelectWorkspace(workspace)}
                    className={cn(
                      "flex items-center gap-2 py-2",
                      isActive && "bg-accent"
                    )}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className={cn(getWorkspaceColor(contact), "text-white")}>
                        {getWorkspaceIcon(contact)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{workspace.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {contact?.name || 'No contact'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {isActive && <Check className="h-4 w-4" />}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* All Workspaces */}
        {otherWorkspaces.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              All Workspaces
            </DropdownMenuLabel>
            <DropdownMenuGroup className="max-h-[200px] overflow-y-auto">
              {otherWorkspaces.map(workspace => {
                const contact = getContactForWorkspace(workspace);
                const isActive = workspace.id === currentWorkspaceId;
                
                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => handleSelectWorkspace(workspace)}
                    className={cn(
                      "flex items-center gap-2 py-2",
                      isActive && "bg-accent"
                    )}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className={cn(getWorkspaceColor(contact), "text-white")}>
                        {getWorkspaceIcon(contact)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{workspace.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {contact?.type} • {contact?.name || 'No contact'}
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* No results */}
        {searchQuery && filteredWorkspaces.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No workspaces found
          </div>
        )}
        
        {/* Actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleCreateWorkspace}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Workspace
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleManageWorkspaces}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Workspaces
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}