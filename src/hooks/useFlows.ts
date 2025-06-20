import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './use-auth';
import { useOrganization } from './useOrganization';
import { Flow } from '@/types/conex';

export interface UseFlowsReturn {
  flows: Flow[];
  loading: boolean;
  error: string | null;
  createFlow: (flowData: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Flow>;
  updateFlow: (flowId: string, updates: Partial<Flow>) => Promise<Flow>;
  deleteFlow: (flowId: string) => Promise<void>;
  refreshFlows: () => Promise<void>;
}

export function useFlows(): UseFlowsReturn {
  const { user } = useAuth();
  const { currentOrganization: organization } = useOrganization();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache and performance refs
  const cacheRef = useRef<{ [key: string]: { data: Flow[], timestamp: number } }>({});
  const loadingRef = useRef(false);
  const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes
  
  // Memoized identifiers to prevent unnecessary re-renders
  const userId = useMemo(() => user?.uid, [user?.uid]);
  const orgId = useMemo(() => organization?.id, [organization?.id]);
  const cacheKey = useMemo(() => `${userId}_${orgId}`, [userId, orgId]);

  const fetchFlows = useCallback(async () => {
    if (!userId || !orgId) {
      setLoading(false);
      setError(null);
      setFlows([]);
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (loadingRef.current) return;
    
    // Check cache first
    const cached = cacheRef.current[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setFlows(cached.data);
      setLoading(false);
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const token = await user!.getIdToken();
      
      const response = await fetch('/api/flows', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': orgId
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch flows`);
      }

      const data = await response.json();
      const fetchedFlows = data.flows || [];
      
      // Update cache
      cacheRef.current[cacheKey] = {
        data: fetchedFlows,
        timestamp: Date.now()
      };
      
      setFlows(fetchedFlows);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flows';
      setError(errorMessage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [userId, orgId, cacheKey, user]);

  const createFlow = async (flowData: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flow> => {
    if (!user || !organization) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('🆕 Creating new flow in Firebase');
      const token = await user.getIdToken();
      
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(flowData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create flow`);
      }

      const newFlow = await response.json();
      setFlows(prev => [newFlow, ...prev]);
      console.log('✅ Flow created successfully:', newFlow.id);
      return newFlow;
    } catch (error) {
      console.error('Error creating flow:', error);
      throw error;
    }
  };

  const updateFlow = async (flowId: string, updates: Partial<Flow>): Promise<Flow> => {
    if (!user || !organization) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('📝 Updating flow in Firebase:', flowId);
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/flows?id=${flowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to update flow`);
      }

      const updatedFlow = await response.json();
      setFlows(prev => prev.map(flow => 
        flow.id === flowId ? updatedFlow : flow
      ));
      console.log('✅ Flow updated successfully:', flowId);
      return updatedFlow;
    } catch (error) {
      console.error('Error updating flow:', error);
      throw error;
    }
  };

  const deleteFlow = async (flowId: string): Promise<void> => {
    if (!user || !organization) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('🗑️ Deleting flow from Firebase:', flowId);
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/flows?id=${flowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete flow`);
      }

      setFlows(prev => prev.filter(flow => flow.id !== flowId));
      console.log('✅ Flow deleted successfully:', flowId);
    } catch (error) {
      console.error('Error deleting flow:', error);
      throw error;
    }
  };

  const refreshFlows = async () => {
    await fetchFlows();
  };

  useEffect(() => {
    if (userId && orgId) {
      fetchFlows();
    }
  }, [userId, orgId, fetchFlows]);

  return {
    flows,
    loading,
    error,
    createFlow,
    updateFlow,
    deleteFlow,
    refreshFlows
  };
}