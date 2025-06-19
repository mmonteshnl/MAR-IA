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
        console.log('📋 Input data received:', options.inputData);
        console.log('🔗 Flow nodes:', options.flowDefinition.nodes.length);
        console.log('⚡ Flow connections:', options.flowDefinition.edges.length);
      }

      // For now, simulate execution locally for demo purposes
      // In production, this would make an API call with proper auth
      console.log('🧪 DEMO MODE: Simulating flow execution locally');
      
      // Asegurar que tenemos datos de entrada válidos
      const inputData = Object.keys(options.inputData || {}).length > 0 
        ? options.inputData 
        : {
            leadName: 'Demo Lead',
            leadEmail: 'demo@ejemplo.com',
            leadPhone: '+1234567890',
            leadIndustry: 'Tecnología',
            leadValue: 25000,
            leadSource: 'Demo'
          };
      
      
      // Simular resultados realistas basados en los nodos del flujo
      const simulatedResults: Record<string, any> = {};
      
      // Primero procesar todos los nodos excepto Monitor
      const nonMonitorNodes = options.flowDefinition.nodes.filter(node => node.type !== 'monitor');
      const monitorNodes = options.flowDefinition.nodes.filter(node => node.type === 'monitor');
      
      // Procesar nodos no-monitor primero (de forma secuencial para asegurar orden)
      for (const node of nonMonitorNodes) {
        const nodeId = node.id;
        
        switch (node.type) {
          case 'trigger':
            simulatedResults[nodeId] = {
              success: true,
              input: inputData,
              timestamp: new Date().toISOString()
            };
            break;
            
          case 'apiCall':
          case 'httpRequest':
            // Para httpRequest, intentar hacer la llamada real
            if (node.type === 'httpRequest' && node.data?.config?.url) {
              try {
                // Hacer la llamada HTTP real
                const url = node.data.config.url;
                const method = node.data.config.method || 'GET';
                const headers = node.data.config.headers || {};
                
                if (options.enableLogs) {
                  console.log(`🌐 Making real HTTP ${method} request to:`, url);
                }
                
                // Hacer la llamada real usando fetch
                const response = await fetch(url, {
                  method,
                  headers: {
                    'Content-Type': 'application/json',
                    ...headers
                  },
                  ...(method !== 'GET' && { body: JSON.stringify(node.data.config.body || {}) })
                });
                
                const responseData = await response.json();
                
                simulatedResults[nodeId] = {
                  success: response.ok,
                  status: response.status,
                  statusText: response.statusText,
                  data: responseData,
                  headers: Object.fromEntries(response.headers.entries()),
                  timestamp: new Date().toISOString(),
                  realApiCall: true
                };
                
                if (options.enableLogs) {
                  console.log(`✅ HTTP ${method} request completed:`, {
                    status: response.status,
                    data: responseData
                  });
                }
              } catch (error) {
                if (options.enableLogs) {
                  console.error('❌ HTTP request failed:', error);
                }
                
                simulatedResults[nodeId] = {
                  success: false,
                  status: 0,
                  error: error instanceof Error ? error.message : 'HTTP request failed',
                  timestamp: new Date().toISOString(),
                  realApiCall: true
                };
              }
            } else {
              // Fallback a simulación para otros casos
              simulatedResults[nodeId] = {
                success: true,
                status: 200,
                data: {
                  message: 'API call successful',
                  receivedData: inputData,
                  apiResponse: {
                    id: `api_${Date.now()}`,
                    status: 'completed',
                    result: 'Processed successfully'
                  }
                },
                timestamp: new Date().toISOString()
              };
            }
            break;
            
          case 'dataTransform':
            simulatedResults[nodeId] = {
              success: true,
              originalData: inputData,
              transformedData: {
                ...inputData,
                processed: true,
                transformedAt: new Date().toISOString(),
                industry_category: inputData.leadIndustry === 'Tecnología' ? 'Tech' : 'Other',
                value_tier: inputData.leadValue > 20000 ? 'High' : 'Standard'
              },
              timestamp: new Date().toISOString()
            };
            break;
            
          default:
            simulatedResults[nodeId] = {
              success: true,
              data: inputData,
              timestamp: new Date().toISOString()
            };
        }
      }
      
      // Ahora procesar los nodos Monitor con todos los resultados anteriores disponibles
      monitorNodes.forEach((node) => {
        const nodeId = node.id;
        
        // Para el Monitor, simular que captura todos los datos del contexto
        const allPreviousResults = Object.keys(simulatedResults).reduce((acc, key) => {
          acc[`step_${key}`] = simulatedResults[key];
          return acc;
        }, {} as Record<string, any>);
        
        simulatedResults[nodeId] = {
          success: true,
          monitorName: node.data.name || 'Monitor Debug',
          timestamp: new Date().toISOString(),
          dataSnapshot: {
            trigger: { input: inputData },
            stepResults: allPreviousResults,
            currentVariables: {
              trigger: { input: inputData },
              ...allPreviousResults
            }
          },
          formattedOutput: JSON.stringify({
            trigger: { input: inputData },
            stepResults: allPreviousResults
          }, null, 2),
          consoleLog: {
            title: `🔍 MONITOR: ${node.data.name || 'Monitor Debug'}`,
            data: {
              trigger: { input: inputData },
              stepResults: allPreviousResults
            },
            format: 'json',
            timestamp: new Date().toISOString()
          }
        };
      });
      
      const simulatedResult = {
        success: true,
        results: simulatedResults,
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
          
          // Si es un nodo Monitor, mostrar el log especial
          if ((stepResult as any)?.consoleLog) {
            const monitorResult = stepResult as any;
            console.log(monitorResult.consoleLog.title);
            console.log('⏰ Timestamp:', monitorResult.consoleLog.timestamp);
            console.log('📦 Datos capturados:', monitorResult.consoleLog.data);
          } else {
            console.log(stepResult);
          }
          
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