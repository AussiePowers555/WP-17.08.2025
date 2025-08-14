"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { useToast } from '@/hooks/use-toast';

export type WorkspaceRole = 'admin' | 'workspace';

export interface WorkspaceContextValue {
  id?: string;
  name: string;
  role: WorkspaceRole;
  contactType?: string;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string | null, workspaceName?: string) => void;
  backToMain: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
  initialWorkspaceId?: string;
  initialRole?: WorkspaceRole;
  initialWorkspaceName?: string;
  initialContactType?: string;
}

export function WorkspaceProvider({ 
  children, 
  initialWorkspaceId,
  initialRole = 'workspace',
  initialWorkspaceName = 'Main Workspace',
  initialContactType
}: WorkspaceProviderProps) {
  // Initialize with session storage values first, then fall back to props
  const [activeWorkspace, setActiveWorkspace] = useSessionStorage<string | null>(
    'activeWorkspace', 
    () => {
      // If there's an initial workspace ID from props (user login), use it
      if (initialWorkspaceId && initialWorkspaceId !== 'MAIN') {
        return initialWorkspaceId;
      }
      // Otherwise default to null (Main workspace)
      return null;
    }
  );
  const [role, setRole] = useSessionStorage<WorkspaceRole>('role', initialRole);
  const [workspaceName, setWorkspaceName] = useSessionStorage<string>('workspaceName', initialWorkspaceName);
  const [contactType, setContactType] = useSessionStorage<string | undefined>('contactType', initialContactType);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Debounce timer for toast notifications
  const toastTimerRef = React.useRef<NodeJS.Timeout>();

  // Generate display name based on current workspace
  const displayName = activeWorkspace && activeWorkspace !== 'MAIN' 
    ? `${contactType || 'Client'}: ${workspaceName} Workspace`
    : 'Main Workspace';

  const switchWorkspace = useCallback((workspaceId: string | null, newWorkspaceName?: string) => {
    setIsLoading(true);
    
    // Clear any pending toast
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    
    if (workspaceId && workspaceId !== 'MAIN') {
      setActiveWorkspace(workspaceId);
      if (newWorkspaceName) {
        setWorkspaceName(newWorkspaceName);
      }
      
      // Debounce toast notification
      toastTimerRef.current = setTimeout(() => {
        toast({
          title: "Workspace switched",
          description: `Now viewing ${newWorkspaceName || 'workspace'} data`,
        });
      }, 100);
    } else {
      setActiveWorkspace('MAIN');
      setWorkspaceName('Main Workspace');
      setContactType(undefined);
      
      // Debounce toast notification
      toastTimerRef.current = setTimeout(() => {
        toast({
          title: "Switched to Main Workspace",
          description: "Now viewing all cases across all workspaces",
        });
      }, 100);
    }
    
    setIsLoading(false);
  }, [setActiveWorkspace, setWorkspaceName, setContactType, toast]);

  const backToMain = () => {
    switchWorkspace(null);
  };

  // Update workspace info when activeWorkspace changes
  useEffect(() => {
    if (activeWorkspace === 'MAIN' || !activeWorkspace) {
      setWorkspaceName('Main Workspace');
      setContactType(undefined);
    }
    // Log for debugging
    console.log('[WorkspaceContext] Active workspace changed:', activeWorkspace);
  }, [activeWorkspace, setWorkspaceName, setContactType]);
  
  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const contextValue: WorkspaceContextValue = {
    id: activeWorkspace === 'MAIN' || activeWorkspace === null ? undefined : activeWorkspace,
    name: displayName,
    role,
    contactType,
    isLoading,
    switchWorkspace,
    backToMain
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export { WorkspaceContext };