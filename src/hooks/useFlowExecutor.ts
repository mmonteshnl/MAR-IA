import { useState } from 'react';
import { FlowDefinition } from '@/lib/flow-executor';

export interface FlowExecution {
  executionId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: Date;
  updatedAt: Date;
  results?: Record<string, any>;
  error?: string;
  currentStep?: string;
  stepResults?: Record<string, any>;
}

export interface ExecuteFlowOptions {
  inputData: Record<string, any>;
  flowDefinition: FlowDefinition;
  enableLogs?: boolean;
}

export interface UseFlowExecutorReturn {
  executing: boolean;
  error: string | null;
  currentExecution: FlowExecution | null;
  executeFlow: (options: ExecuteFlowOptions) => Promise<FlowExecution>;
  resumeExecution: (executionId: string) => Promise<FlowExecution>;
  getExecutionHistory: () => Promise<FlowExecution[]>;
  clearError: () => void;
}

export function useFlowExecutor(): UseFlowExecutorReturn {
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentExecution, setCurrentExecution] = useState<FlowExecution | null>(null);

  const executeFlow = async (options: ExecuteFlowOptions): Promise<FlowExecution> => {
    try {
      setExecuting(true);
      setError(null);
      
      if (options.enableLogs) {
        console.log('🚀 Starting flow execution...');
        console.log('📋 Input data:', options.inputData);
        console.log('🔗 Flow nodes:', options.flowDefinition.nodes.length);
        console.log('⚡ Flow connections:', options.flowDefinition.edges.length);
      }

      // For now, simulate execution locally for demo purposes
      // In production, this would make an API call with proper auth
      console.log('🧪 DEMO MODE: Simulating flow execution locally');
      
      const simulatedResult = {
        success: true,
        results: {
          'trigger-1': options.inputData,
          'step-1': { processed: true, data: options.inputData }
        },
        executionId: `sim_${Date.now()}`
      };

      const execution: FlowExecution = {
        executionId: simulatedResult.executionId,
        status: simulatedResult.success ? 'completed' : 'failed',
        startedAt: new Date(),
        updatedAt: new Date(),
        results: simulatedResult.results,
        error: undefined,
        stepResults: simulatedResult.results
      };

      setCurrentExecution(execution);

      if (options.enableLogs) {
        console.log('✅ Flow execution completed');
        console.log('📊 Results:', execution.results);
        
        if (simulatedResult.success) {
          console.log('🎉 Execution successful!');
        } else {
          console.error('❌ Execution failed:', execution.error);
        }
        
        // Log individual step results for debugging
        Object.entries(execution.stepResults || {}).forEach(([stepId, stepResult]) => {
          console.group(`📦 Step: ${stepId}`);
          console.log(stepResult);
          console.groupEnd();
        });
      }

      return execution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute flow';
      setError(errorMessage);
      console.error('Flow execution error:', err);
      throw err;
    } finally {
      setExecuting(false);
    }
  };

  const resumeExecution = async (executionId: string): Promise<FlowExecution> => {
    try {
      setExecuting(true);
      setError(null);
      
      console.log('🔄 DEMO MODE: Simulating resume execution:', executionId);

      // Simulate resumed execution
      const execution: FlowExecution = {
        executionId,
        status: 'completed',
        startedAt: new Date(Date.now() - 60000), // 1 minute ago
        updatedAt: new Date(),
        results: { resumed: true },
        currentStep: 'completed',
        stepResults: { resumed: true }
      };

      setCurrentExecution(execution);
      console.log('✅ Flow execution resumed and completed');

      return execution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume execution';
      setError(errorMessage);
      console.error('Flow resume error:', err);
      throw err;
    } finally {
      setExecuting(false);
    }
  };

  const getExecutionHistory = async (): Promise<FlowExecution[]> => {
    try {
      console.log('📋 DEMO MODE: Simulating execution history');
      
      // Return mock execution history
      return [
        {
          executionId: 'sim_' + (Date.now() - 120000),
          status: 'completed' as const,
          startedAt: new Date(Date.now() - 120000),
          updatedAt: new Date(Date.now() - 119000),
          results: { demo: 'execution 1' },
          stepResults: { demo: 'execution 1' }
        },
        {
          executionId: 'sim_' + (Date.now() - 60000),
          status: 'failed' as const,
          startedAt: new Date(Date.now() - 60000),
          updatedAt: new Date(Date.now() - 59000),
          results: {},
          error: 'Demo error',
          stepResults: {}
        }
      ];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch execution history';
      setError(errorMessage);
      console.error('Execution history error:', err);
      return [];
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    executing,
    error,
    currentExecution,
    executeFlow,
    resumeExecution,
    getExecutionHistory,
    clearError
  };
}