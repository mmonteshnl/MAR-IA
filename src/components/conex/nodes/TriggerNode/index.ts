// Importaciones necesarias para metadata
import { validateTriggerNodeConfig, createDefaultTriggerNodeConfig } from './runner';

// Exportaciones principales del TriggerNode Template
export { TriggerNode as Component } from './TriggerNode';
export { TriggerNode } from './TriggerNode';
export { executeTriggerNode as runner, validateTriggerNodeConfig, createDefaultTriggerNodeConfig } from './runner';

// Exportaciones de tipos y schemas
export type { 
  TriggerNodeConfig, 
  TriggerNodeResponse, 
  TriggerNodeError, 
  TriggerNodeResult, 
  TriggerNodeData 
} from './schema';
export { 
  TriggerNodeConfigSchema, 
  TriggerNodeResponseSchema, 
  TriggerNodeErrorSchema 
} from './schema';

// Exportaciones de constantes y configuración
export { 
  TRIGGER_DEFAULTS, 
  TRIGGER_METADATA, 
  EXAMPLE_CONFIGS, 
  HELP_CONTENT 
} from './constants';

// Metadata del nodo para registro automático
export const nodeMetadata = {
  type: 'trigger', // TODO: Cambiar por tipo real
  label: 'Nodo de Inicio', // TODO: Cambiar por label en español
  icon: 'Zap', // TODO: Cambiar por icono apropiado (se convertirá al componente en el registro)
  description: 'Nodo de Inicio - Nodo para utility', // TODO: Cambiar por descripción real
  category: 'utility', // TODO: Cambiar por categoría apropiada (api, data, utility, etc.)
  version: '1.0.0',
  author: 'CMR System',
  
  // Configuración por defecto para nuevos nodos
  defaultConfig: {
    name: 'Nodo de Inicio',
    // TODO: Agregar configuración por defecto específica
  },
  
  // Configuraciones de ejemplo predefinidas
  examples: [
    {
      name: 'Configuración Básica',
      description: 'Configuración básica del nodo',
      config: {
        name: 'Mi Nodo Básico',
        // TODO: Agregar configuración de ejemplo básica
      }
    },
    {
      name: 'Configuración Avanzada',
      description: 'Configuración avanzada del nodo',
      config: {
        name: 'Mi Nodo Avanzado',
        // TODO: Agregar configuración de ejemplo avanzada
      }
    }
  ],
  
  // Tags para búsqueda y categorización
  tags: [
    'base', 'template', 'utility',
    // TODO: Agregar tags reales aquí
    // Ejemplos: 'http', 'api', 'transform', 'database', etc.
  ],
  
  // Capabilities del nodo
  capabilities: {
    hasInput: true, // TODO: Ajustar según necesidades
    hasOutput: true, // TODO: Ajustar según necesidades
    hasConfig: true,
    hasZap: true,
    isAsync: true, // TODO: Ajustar si el nodo no es asíncrono
    canFail: true,
    supportsRetry: false, // TODO: Ajustar si soporta reintentos
    supportsTimeout: false, // TODO: Ajustar si soporta timeouts
    supportsVariables: true,
    supportsConnections: false, // TODO: Ajustar si necesita conexiones
  },
  
  // Validación de configuración (función de utilidad)
  validateConfig: validateTriggerNodeConfig,
  
  // Configuración por defecto mejorada
  getDefaultConfig: createDefaultTriggerNodeConfig,
  
  // Información para el flow builder UI
  builderInfo: {
    color: 'gray', // TODO: Cambiar por color específico del nodo
    borderColor: 'border-blue-500', // TODO: Cambiar por color específico
    textColor: 'text-blue-400', // TODO: Cambiar por color específico
    bgColor: 'bg-blue-50', // TODO: Cambiar por color específico
    darkBgColor: 'bg-blue-900', // TODO: Cambiar por color específico
  }
} as const;

// Re-exportar runner para compatibilidad con FlowExecutor existente
export { executeTriggerNode } from './runner';

// Export tipo del metadata para TypeScript
export type TriggerNodeMetadata = typeof nodeMetadata;