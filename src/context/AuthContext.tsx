import { createContext, useContext, useEffect, useState } from 'react';
import { useSessionStorage } from '../hooks/use-session-storage';

type User = {
  id: string;
  email: string;
  role: string;
  name: string;
  contactId?: string;
  workspaceId?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => void;
  login: (user: User) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  login: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useSessionStorage<User | null>('currentUser', null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple initialization without loops
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    // Clear all workspace-related session storage
    sessionStorage.removeItem('activeWorkspace');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('workspaceName');
    sessionStorage.removeItem('contactType');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    
    // Initialize workspace context based on user role and workspace assignment
    if (typeof window !== 'undefined') {
      const { workspaceId, role } = userData;
      
      // Set role in session storage
      const userRole = role === 'admin' || role === 'developer' ? 'admin' : 'workspace';
      sessionStorage.setItem('role', JSON.stringify(userRole));
      
      // Set active workspace - for workspace_user, client, lawyer, rental_company ALWAYS use their assigned workspace
      // Only admins/developers can have MAIN or switch workspaces
      const isRestrictedRole = role === 'workspace_user' || role === 'client' || role === 'lawyer' || role === 'rental_company';
      const activeWorkspace = isRestrictedRole && workspaceId 
        ? workspaceId  // Force restricted roles to their workspace
        : (workspaceId ?? 'MAIN');  // Admins can use MAIN or assigned workspace
      
      sessionStorage.setItem('activeWorkspace', JSON.stringify(activeWorkspace));
      
      // Dispatch events for same-tab synchronization
      window.dispatchEvent(new CustomEvent('sessionStorageChange', {
        detail: { key: 'role', value: userRole }
      }));
      window.dispatchEvent(new CustomEvent('sessionStorageChange', {
        detail: { key: 'activeWorkspace', value: activeWorkspace }
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);