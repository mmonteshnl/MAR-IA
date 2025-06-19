// Exportaciones principales del LeadValidatorNode Template
export { LeadValidatorNode as Component } from './LeadValidatorNode';
export { LeadValidatorNodeUser as User } from './LeadValidatorNodeUser';
export { executeLeadValidatorNode as runner, validateLeadValidatorNodeConfig, createDefaultLeadValidatorNodeConfig } from './runner';

// Exportaciones de tipos y schemas
export type { 
  LeadValidatorNodeConfig, 
  LeadValidatorNodeResponse, 
  LeadValidatorNodeError, 
  LeadValidatorNodeResult, 
  LeadValidatorNodeData 
} from './schema';
export { 
  LeadValidatorNodeConfigSchema, 
  LeadValidatorNodeResponseSchema, 
  LeadValidatorNodeErrorSchema 
} from './schema';

// Exportaciones de constantes y configuración
export { 
  LEAD_VALIDATOR_DEFAULTS, 
  LEAD_VALIDATOR_METADATA, 
  EXAMPLE_CONFIGS, 
  HELP_CONTENT 
} from './constants';

// Metadata del nodo para registro automático
export const nodeMetadata = {
  type: 'leadValidator',
  label: 'Validador de Leads',
  icon: 'UserCheck',
  description: 'Valida y edita datos de leads con condiciones lógicas avanzadas',
  category: 'data',
  version: '1.0.0',
  author: 'CMR System',
  
  // Configuración por defecto para nuevos nodos
  defaultConfig: {
    name: 'Validador de Leads',
    mode: 'validator',
    enableLogging: true,
    logLevel: 'detailed',
    continueOnError: true,
    validatorConfig: {
      conditions: [
        {
          field: 'context',
          operator: '==',
          value: 'premium'
        }
      ],
      outputField: 'isValid',
      trueMessage: 'Validación exitosa',
      falseMessage: 'Validación fallida'
    }
  },
  
  // Configuraciones de ejemplo predefinidas
  examples: [
    {
      name: 'Validador Premium',
      description: 'Valida si un lead es premium basado en contexto y valor',
      config: {
        name: 'Validador Premium',
        mode: 'validator',
        validatorConfig: {
          conditions: [
            {
              field: 'context',
              operator: '==',
              value: 'premium',
              logicOperator: 'AND'
            },
            {
              field: 'leadValue',
              operator: '>',
              value: 5000
            }
          ],
          outputField: 'isPremiumLead',
          trueMessage: 'Lead premium válido',
          falseMessage: 'No cumple criterios premium'
        }
      }
    },
    {
      name: 'Editor de Prioridad',
      description: 'Actualiza la prioridad del lead según su valor',
      config: {
        name: 'Editor de Prioridad',
        mode: 'editor',
        editorConfig: {
          actions: [
            {
              name: 'Clasificar por Valor',
              conditions: [
                {
                  field: 'leadValue',
                  operator: '>',
                  value: 10000
                }
              ],
              trueActions: {
                updates: [
                  { field: 'stage', value: 'High Priority' },
                  { field: 'priority', value: 5 }
                ],
                message: 'Lead marcado como alta prioridad'
              },
              falseActions: {
                updates: [
                  { field: 'stage', value: 'Standard' },
                  { field: 'priority', value: 3 }
                ],
                message: 'Lead marcado como prioridad estándar'
              }
            }
          ],
          updateDatabase: false,
          collection: 'leads',
          identifierField: 'id'
        }
      }
    },
    {
      name: 'Router por Valor',
      description: 'Dirige leads a diferentes rutas según su valor',
      config: {
        name: 'Router por Valor',
        mode: 'router',
        routerConfig: {
          routes: [
            {
              id: 'enterprise',
              name: 'Ruta Enterprise',
              conditions: [
                {
                  field: 'leadValue',
                  operator: '>',
                  value: 50000
                }
              ],
              output: 'enterprise_path',
              updates: [
                { field: 'tier', value: 'enterprise' }
              ]
            },
            {
              id: 'premium',
              name: 'Ruta Premium',
              conditions: [
                {
                  field: 'leadValue',
                  operator: '>',
                  value: 10000
                }
              ],
              output: 'premium_path',
              updates: [
                { field: 'tier', value: 'premium' }
              ]
            }
          ],
          defaultRoute: 'standard_path'
        }
      }
    }
  ],
  
  // Tags para búsqueda y categorización
  tags: [
    'leads', 'validation', 'conditions', 'editor', 'router', 'database', 'logic', 'data'
  ],
  
  // Capabilities del nodo
  capabilities: {
    hasInput: true,
    hasOutput: true,
    hasConfig: true,
    hasUser: true,
    isAsync: true,
    canFail: true,
    supportsRetry: true,
    supportsTimeout: false,
    supportsVariables: true,
    supportsConnections: false,
    supportsMultipleOutputs: true, // Para modo router
    supportsDatabaseWrites: true   // Para modo editor
  },
  
  // Validación de configuración (función de utilidad)
  validateConfig: validateLeadValidatorNodeConfig,
  
  // Configuración por defecto mejorada
  getDefaultConfig: createDefaultLeadValidatorNodeConfig,
  
  // Información para el flow builder UI
  builderInfo: {
    color: 'orange',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-50',
    darkBgColor: 'bg-orange-900',
  }
} as const;

// Re-exportar runner para compatibilidad con FlowExecutor existente
export { executeLeadValidatorNode } from './runner';

// Export tipo del metadata para TypeScript
export type LeadValidatorNodeMetadata = typeof nodeMetadata;