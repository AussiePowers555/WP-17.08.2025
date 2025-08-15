'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { InteractionFeedView, InteractionFilters, InteractionSortOptions } from '@/types/interaction';
import { getInteractions } from '@/lib/actions/interactions';
import { exportFilteredInteractions } from '@/lib/export-utils';
import { InteractionCardEnhanced } from '@/components/interactions/interaction-card-enhanced';
import { InteractionFiltersPanelEnhanced } from '@/components/interactions/interaction-filters-enhanced';
import { InteractionCreateEnhanced } from '@/components/interactions/interaction-create-enhanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Plus, 
  RefreshCw,
  MessageSquare,
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InteractionsPage() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  
  // State management
  const [interactions, setInteractions] = useState<InteractionFeedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Filter and sort state
  const [filters, setFilters] = useState<InteractionFilters>({});
  const [sort, setSort] = useState<InteractionSortOptions>({
    field: 'timestamp',
    direction: 'desc'
  });
  
  // Options for filters (these would typically come from API)
  const [filterOptions, setFilterOptions] = useState({
    insuranceCompanies: [] as string[],
    lawyers: [] as string[],
    rentalCompanies: [] as string[],
    caseNumbers: [] as string[]
  });
  
  // Real-time updates flag
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Get workspace ID and contact ID based on user role
  const isAdmin = workspace.role === 'admin' || user?.role === 'admin' || user?.role === 'developer';
  const isClient = workspace.role === 'client' || user?.role === 'client';
  const isWorkspaceUser = user?.role === 'workspace_user' || isClient || user?.role === 'lawyer' || user?.role === 'rental_company' || (!isAdmin && user?.workspaceId);
  
  // For client users, always use their workspace ID from user object
  // The workspace context might not be set properly for client users
  // Check both workspace_id and workspaceId as the server might use either
  const userWorkspaceId = (user as any)?.workspace_id || (user as any)?.workspaceId || user?.workspaceId;
  
  // IMPORTANT: For workspace_user role, ALWAYS use their assigned workspace, never fall back to context
  const currentWorkspaceId = isWorkspaceUser
    ? userWorkspaceId  // Force workspace users to their assigned workspace only
    : isAdmin 
      ? (workspace.id || 'MAIN')  // Admins can switch workspaces
      : userWorkspaceId || workspace.id || 'MAIN';  // Others use their workspace or context
  
  // For filtering:
  // - Client/Workspace users: ALWAYS filter by their workspace ID
  // - Admin in MAIN workspace: undefined (show all)
  // - Admin in specific workspace: that workspace ID
  const filterWorkspaceId = isAdmin && currentWorkspaceId === 'MAIN' 
    ? undefined 
    : currentWorkspaceId; // Always use workspace ID for filtering
  
  const filterContactId = undefined; // Don't filter by contact ID anymore
  
  // Fetch interactions
  const fetchInteractions = useCallback(async (pageNum: number = 1, reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
      }

      console.log('[DEBUG] Fetching interactions with:', {
        user: user?.email,
        userRole: user?.role,
        userWorkspaceId: userWorkspaceId,
        'user.workspace_id': (user as any)?.workspace_id,
        'user.workspaceId': (user as any)?.workspaceId,
        'user.workspaceId (direct)': user?.workspaceId,
        workspaceContextRole: workspace.role,
        workspaceContextId: workspace.id,
        isClient,
        isWorkspaceUser,
        isAdmin,
        currentWorkspaceId,
        filterWorkspaceId,
        filterContactId,
        expectedWorkspace: user?.role === 'workspace_user' ? '571ab2ed-e9b0-42f4-a09c-2e74c2af7e6d' : 'varies'
      });

      // Workspace filtering is now handled securely on the server
      // Pass the workspace filter for admins viewing specific workspaces
      const result = await getInteractions(pageNum, 20, filters, sort, filterWorkspaceId, filterContactId);
      
      if (result.success && result.data) {
        if (reset) {
          setInteractions(result.data.interactions);
        } else {
          setInteractions(prev => [...prev, ...result.data!.interactions]);
        }
        setHasMore(result.data.hasMore);
        setTotalCount(result.data.totalCount);
        setPage(pageNum);
        
        // Extract unique filter options from interactions
        updateFilterOptions(result.data.interactions);
      } else {
        setError(result.error || 'Failed to load interactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, sort, filterWorkspaceId, filterContactId]);
  
  // Update filter options from interactions
  const updateFilterOptions = (newInteractions: InteractionFeedView[]) => {
    const allInteractions = [...interactions, ...newInteractions];
    
    const uniqueInsurance = [...new Set(allInteractions
      .map(i => i.insuranceCompany)
      .filter(Boolean))] as string[];
      
    const uniqueLawyers = [...new Set(allInteractions
      .map(i => i.lawyerAssigned)
      .filter(Boolean))] as string[];
      
    const uniqueRentals = [...new Set(allInteractions
      .map(i => i.rentalCompany)
      .filter(Boolean))] as string[];
      
    const uniqueCases = [...new Set(allInteractions
      .map(i => i.caseNumber)
      .filter(Boolean))] as string[];
    
    setFilterOptions({
      insuranceCompanies: uniqueInsurance.sort(),
      lawyers: uniqueLawyers.sort(),
      rentalCompanies: uniqueRentals.sort(),
      caseNumbers: uniqueCases.sort()
    });
  };
  
  // Load more interactions
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchInteractions(page + 1, false);
    }
  };
  
  // Refresh interactions
  const refresh = () => {
    fetchInteractions(1, true);
  };
  
  // Handle filter changes
  const handleFiltersChange = (newFilters: InteractionFilters) => {
    setFilters(newFilters);
    setPage(1);
  };
  
  // Handle sort changes
  const handleSortChange = (newSort: InteractionSortOptions) => {
    setSort(newSort);
    setPage(1);
  };
  
  // Handle export
  const handleExport = () => {
    exportFilteredInteractions(interactions, filters);
  };
  
  // Handle interaction created
  const handleInteractionCreated = (newInteraction: InteractionFeedView) => {
    setInteractions(prev => [newInteraction, ...prev]);
    setTotalCount(prev => prev + 1);
    setShowCreateDialog(false);
    
    // Update filter options
    updateFilterOptions([newInteraction]);
  };
  
  // Handle interaction updated
  const handleInteractionUpdated = (updatedInteraction: InteractionFeedView) => {
    setInteractions(prev => 
      prev.map(int => int.id === updatedInteraction.id ? updatedInteraction : int)
    );
  };
  
  // Handle interaction deleted
  const handleInteractionDeleted = async (interactionId: number) => {
    try {
      // Call the database delete function
      const response = await fetch('/api/interactions/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interactionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete interaction');
      }

      // Update UI state after successful deletion
      setInteractions(prev => prev.filter(int => int.id !== interactionId));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting interaction:', error);
      throw error; // Re-throw to be handled by the component
    }
  };
  
  // Initial load and filter/sort changes
  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);
  
  // Auto-refresh for real-time updates
  useEffect(() => {
    if (autoRefresh && !loading) {
      const interval = setInterval(() => {
        fetchInteractions(1, true);
      }, 15000); // Refresh every 15 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loading, fetchInteractions]);
  
  if (!user) {
    return null;
  }
  
  if (loading && interactions.length === 0) {
    return <InteractionPageSkeleton />;
  }
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Customer Interactions
          </h1>
          <p className="text-muted-foreground">
            Real-time feed of all customer communications and actions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Auto-refresh indicator */}
          <div className="flex items-center gap-2">
            <Activity className={cn(
              "h-4 w-4",
              autoRefresh ? "text-green-600 animate-pulse" : "text-muted-foreground"
            )} />
            <span className="text-sm text-muted-foreground">
              {autoRefresh ? 'Live' : 'Paused'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Pause' : 'Resume'}
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Log Interaction
          </Button>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today\'s Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interactions.filter(i => {
                const today = new Date().toDateString();
                return new Date(i.timestamp).toDateString() === today;
              }).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {interactions.filter(i => i.status === 'follow_up_required').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {interactions.filter(i => i.priority === 'urgent' || i.priority === 'high').length}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters Panel */}
      <InteractionFiltersPanelEnhanced
        filters={filters}
        onFiltersChange={handleFiltersChange}
        sort={sort}
        onSortChange={handleSortChange}
        onExport={handleExport}
        insuranceCompanies={filterOptions.insuranceCompanies}
        lawyers={filterOptions.lawyers}
        rentalCompanies={filterOptions.rentalCompanies}
        caseNumbers={filterOptions.caseNumbers}
      />
      
      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Empty State */}
      {interactions.length === 0 && !loading && !error && (
        <Card>
          <CardHeader className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>No Interactions Found</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              {filters && Object.keys(filters).length > 0 
                ? 'No interactions match your current filters. Try adjusting your search criteria.'
                : 'Start logging customer interactions to build a comprehensive record.'
              }
            </CardDescription>
            <Button 
              className="mt-4 gap-2" 
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Log First Interaction
            </Button>
          </CardHeader>
        </Card>
      )}
      
      {/* Interactions Feed */}
      {interactions.length > 0 && (
        <div className="space-y-4">
          {interactions.map((interaction, index) => (
            <InteractionCardEnhanced
              key={`${interaction.id}-${index}`}
              interaction={interaction}
              onUpdate={handleInteractionUpdated}
              onDelete={handleInteractionDeleted}
            />
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={refreshing}
                className="gap-2"
              >
                {refreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Load More ({totalCount - interactions.length} remaining)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Stats Footer */}
      {interactions.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <span>
              Showing {interactions.length} of {totalCount} interactions
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export ({interactions.length} items)
          </Button>
        </div>
      )}
      
      {/* Create Interaction Dialog */}
      {showCreateDialog && (
        <InteractionCreateEnhanced
          workspaceId={currentWorkspaceId}
          contactId={filterContactId}
          isWorkspaceUser={!!isWorkspaceUser}
          onSuccess={handleInteractionCreated}
          onCancel={() => setShowCreateDialog(false)}
          open={showCreateDialog}
        />
      )}
    </div>
  );
}

// Loading skeleton component
function InteractionPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}