import { useState, useEffect } from 'react';
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
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlows = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 DEMO MODE: Using mock flows data');
      
      // Mock flows data for demo
      const mockFlows: Flow[] = [];
      setFlows(mockFlows);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flows';
      setError(errorMessage);
      console.error('Error fetching flows:', err);
    } finally {
      setLoading(false);
    }
  };

  const createFlow = async (flowData: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flow> => {
    console.log('📋 DEMO MODE: Simulating flow creation');
    
    const newFlow: Flow = {
      ...flowData,
      id: `flow_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: 'demo-org'
    };
    
    setFlows(prev => [newFlow, ...prev]);
    return newFlow;
  };

  const updateFlow = async (flowId: string, updates: Partial<Flow>): Promise<Flow> => {
    console.log('📋 DEMO MODE: Simulating flow update');
    
    const updatedFlow: Flow = flows.find(f => f.id === flowId)!;
    const result = { ...updatedFlow, ...updates, updatedAt: new Date() };
    
    setFlows(prev => prev.map(flow => 
      flow.id === flowId ? result : flow
    ));
    return result;
  };

  const deleteFlow = async (flowId: string): Promise<void> => {
    console.log('📋 DEMO MODE: Simulating flow deletion');
    setFlows(prev => prev.filter(flow => flow.id !== flowId));
  };

  const refreshFlows = async () => {
    await fetchFlows();
  };

  useEffect(() => {
    fetchFlows();
  }, []);

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