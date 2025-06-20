import { User } from 'lucide-react'; // TODO: Cambiar por icono apropiado
import { LeadValidatorNodeConfig } from './schema';

// Configuración por defecto del nodo
export const LEAD_VALIDATOR_DEFAULTS: LeadValidatorNodeConfig = {
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
};

// Metadatos del nodo
export const LEAD_VALIDATOR_METADATA = {
  type: 'leadValidator', // TODO: Cambiar por tipo real
  label: 'Validador de Leads', // TODO: Cambiar por label en español
  icon: User, // TODO: Cambiar por icono apropiado
  description: 'Validador de Leads - Nodo para data', // TODO: Cambiar por descripción real
  category: 'data', // TODO: Cambiar por categoría apropiada (api, data, data, etc.)
  version: '1.0.0',
  author: 'CMR System',
} as const;

// TODO: Agregar constantes específicas del nodo aquí
// Ejemplo para HTTP:
// export const METHOD_COLORS = {
//   GET: 'text-green-400',
//   POST: 'text-blue-400',
//   PUT: 'text-yellow-400',
//   DELETE: 'text-red-400',
// } as const;

// Configuraciones de ejemplo predefinidas
export const EXAMPLE_CONFIGS = {
  validatorPremium: {
    name: 'Validador Premium',
    mode: 'validator' as const,
    enableLogging: true,
    logLevel: 'detailed' as const,
    continueOnError: true,
    validatorConfig: {
      conditions: [
        {
          field: 'context',
          operator: '==' as const,
          value: 'premium',
          logicOperator: 'AND' as const
        },
        {
          field: 'leadValue',
          operator: '>' as const,
          value: 5000
        }
      ],
      outputField: 'isPremiumLead',
      trueMessage: 'Lead premium válido',
      falseMessage: 'No cumple criterios premium'
    }
  },
  editorPriority: {
    name: 'Editor de Prioridad',
    mode: 'editor' as const,
    enableLogging: true,
    logLevel: 'detailed' as const,
    continueOnError: true,
    editorConfig: {
      actions: [
        {
          name: 'Clasificar por Valor',
          conditions: [
            {
              field: 'leadValue',
              operator: '>' as const,
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
  },
  routerValue: {
    name: 'Router por Valor',
    mode: 'router' as const,
    enableLogging: true,
    logLevel: 'detailed' as const,
    continueOnError: true,
    routerConfig: {
      routes: [
        {
          id: 'enterprise',
          name: 'Ruta Enterprise',
          conditions: [
            {
              field: 'leadValue',
              operator: '>' as const,
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
              operator: '>' as const,
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
} as const;

// Configuración de ayuda y documentación
export const HELP_CONTENT = {
  nodeType: 'leadValidator',
  title: 'Validador de Leads',
  description: 'Valida y edita datos de leads con condiciones lógicas avanzadas. Soporta tres modos: validación, edición y enrutamiento.',
  usage: [
    'Modo Validator: Valida condiciones y retorna true/false',
    'Modo Editor: Modifica datos del lead basado en condiciones',
    'Modo Router: Dirige el flujo a diferentes rutas según condiciones',
    'Soporte para operadores lógicos AND/OR entre condiciones',
    'Actualización automática de base de datos (modo editor)'
  ],
  examples: [
    `// Validador Premium
{
  mode: "validator",
  validatorConfig: {
    conditions: [
      { field: "context", operator: "==", value: "premium" },
      { field: "leadValue", operator: ">", value: 5000 }
    ],
    outputField: "isPremiumLead"
  }
}`,
    `// Editor de Prioridad
{
  mode: "editor",
  editorConfig: {
    actions: [{
      conditions: [{ field: "leadValue", operator: ">", value: 10000 }],
      trueActions: {
        updates: [{ field: "stage", value: "High Priority" }]
      }
    }]
  }
}`
  ],
  tips: [
    'Usa campos como context, leadValue, leadEmail para validaciones comunes',
    'El modo router permite múltiples salidas según condiciones',
    'Combina condiciones con AND/OR para lógica compleja',
    'Configura logging en "verbose" para debugging detallado',
    'El modo editor puede actualizar la base de datos real'
  ],
} as const;