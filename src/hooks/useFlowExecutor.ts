import { useState, useCallback } from 'react';
import { FlowDefinition } from '@/lib/flow-executor';
import { logger } from '@/lib/logger';

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

  const executeFlow = useCallback(async (options: ExecuteFlowOptions): Promise<FlowExecution> => {
    try {
      setExecuting(true);
      setError(null);
      
      if (options.enableLogs) {
        logger.debug('Starting flow execution...');
        logger.debug('Input data received:', options.inputData);
        logger.debug('Flow nodes:', options.flowDefinition.nodes.length);
        logger.debug('Flow connections:', options.flowDefinition.edges.length);
      }

      logger.debug('DEMO MODE: Simulating flow execution locally');
      
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
                  logger.debug(`Making real HTTP ${method} request to:`, url);
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
                  logger.debug(`✅ HTTP ${method} request completed:`, {
                    status: response.status,
                    data: responseData
                  });
                }
              } catch (error) {
                if (options.enableLogs) {
                  logger.error('❌ HTTP request failed:', error);
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
            
          case 'leadValidator':
            try {
              // Importar el runner del LeadValidatorNode
              const { executeLeadValidatorNode } = await import('@/components/conex/nodes/LeadValidatorNode/runner');
              
              // Preparar contexto de ejecución
              const context = {
                variables: {
                  leadData: inputData,
                  inputData: inputData,
                  trigger: { input: inputData },
                  ...inputData
                },
                stepResults: simulatedResults
              };
              
              // Ejecutar el nodo validador
              const validatorResult = await executeLeadValidatorNode(
                node.data.config || node.data,
                context,
                { enableLogs: options.enableLogs }
              );
              
              simulatedResults[nodeId] = {
                success: validatorResult.success,
                mode: validatorResult.success ? validatorResult.mode : undefined,
                validationResult: validatorResult.success ? validatorResult.validationResult : undefined,
                editorResult: validatorResult.success ? validatorResult.editorResult : undefined,
                routerResult: validatorResult.success ? validatorResult.routerResult : undefined,
                leadData: validatorResult.leadData || { before: inputData, after: inputData },
                error: !validatorResult.success ? validatorResult.error : undefined,
                timestamp: new Date().toISOString(),
                executionTime: validatorResult.executionTime,
                realValidation: true
              };
              
              if (options.enableLogs) {
                if (validatorResult.success) {
                  logger.debug(`✅ LEAD VALIDATOR: Completed successfully in mode ${validatorResult.mode}`);
                } else {
                  logger.error(`❌ LEAD VALIDATOR: Failed - ${validatorResult.error}`);
                }
              }
              
            } catch (error) {
              simulatedResults[nodeId] = {
                success: false,
                error: error instanceof Error ? error.message : 'Lead validator execution failed',
                timestamp: new Date().toISOString(),
                realValidation: true
              };
              
              if (options.enableLogs) {
                logger.error('❌ LEAD VALIDATOR: Exception during execution:', error);
              }
            }
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
        logger.debug('✅ Flow execution completed');
        logger.debug('📊 Results:', execution.results);
        
        if (simulatedResult.success) {
          logger.debug('🎉 Execution successful!');
        } else {
          logger.error('❌ Execution failed:', execution.error);
        }
        
        // Log individual step results for debugging
        Object.entries(execution.stepResults || {}).forEach(([stepId, stepResult]) => {
          console.group(`📦 Step: ${stepId}`);
          
          // Si es un nodo Monitor, mostrar el log especial
          if ((stepResult as any)?.consoleLog) {
            const monitorResult = stepResult as any;
            logger.debug(monitorResult.consoleLog.title);
            logger.debug('⏰ Timestamp:', monitorResult.consoleLog.timestamp);
            logger.debug('📦 Datos capturados:', monitorResult.consoleLog.data);
          } else {
            logger.debug(stepResult);
          }
          
          console.groupEnd();
        });
      }

      return execution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute flow';
      setError(errorMessage);
      logger.error('Flow execution error:', err);
      throw err;
    } finally {
      setExecuting(false);
    }
  }, []);

  const resumeExecution = useCallback(async (executionId: string): Promise<FlowExecution> => {
    try {
      setExecuting(true);
      setError(null);
      
      logger.debug('🔄 DEMO MODE: Simulating resume execution:', executionId);

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
      logger.debug('✅ Flow execution resumed and completed');

      return execution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume execution';
      setError(errorMessage);
      logger.error('Flow resume error:', err);
      throw err;
    } finally {
      setExecuting(false);
    }
  }, []);

  const getExecutionHistory = useCallback(async (): Promise<FlowExecution[]> => {
    try {
      logger.debug('📋 DEMO MODE: Simulating execution history');
      
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
      logger.error('Execution history error:', err);
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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