import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useOrganization } from './useOrganization';
import { Flow } from '@/types/conex';

interface UseManualFlowsReturn {
  manualFlows: Flow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  runFlow: (flowId: string, inputPayload: any) => Promise<{ executionId: string; status: string }>;
}

export function useManualFlows(): UseManualFlowsReturn {
  const { user } = useAuth();
  const { currentOrganization: organization } = useOrganization();
  const [manualFlows, setManualFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManualFlows = async () => {
    if (!user || !organization) {
      // Don't show loading if user/org not ready yet
      setIsLoading(false);
      setError(null);
      setManualFlows([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const token = await user.getIdToken();
      const response = await fetch('/api/flows?triggerType=manual_lead_action&isEnabled=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch manual flows`);
      }

      const data = await response.json();
      setManualFlows(data.flows || []);
      
      // Log success for debugging
      console.log(`✅ Loaded ${data.flows?.length || 0} manual flows`);
    } catch (err) {
      console.error('❌ Error fetching manual flows:', err);
      setError(err instanceof Error ? err.message : 'Failed to load flows');
      setManualFlows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const runFlow = async (flowId: string, inputPayload: any): Promise<{ executionId: string; status: string }> => {
    if (!user || !organization) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    const response = await fetch(`/api/flows/run/${flowId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': organization.id
      },
      body: JSON.stringify({ inputPayload })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to run flow');
    }

    return await response.json();
  };

  useEffect(() => {
    // Only fetch when both user and organization are available
    if (user && organization) {
      fetchManualFlows();
    } else {
      // Reset state when auth is not ready
      setIsLoading(true);
      setError(null);
      setManualFlows([]);
    }
  }, [user, organization]);

  return {
    manualFlows,
    isLoading,
    error,
    refetch: fetchManualFlows,
    runFlow
  };
}