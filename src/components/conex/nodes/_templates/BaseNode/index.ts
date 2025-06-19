// Exportaciones principales del BaseNode Template
export { BaseNode as Component } from './BaseNode';
export { BaseNodeSettings as Settings } from './BaseNodeSettings';
export { executeBaseNode as runner, validateBaseNodeConfig, createDefaultBaseNodeConfig } from './runner';

// Exportaciones de tipos y schemas
export type { 
  BaseNodeConfig, 
  BaseNodeResponse, 
  BaseNodeError, 
  BaseNodeResult, 
  BaseNodeData 
} from './schema';
export { 
  BaseNodeConfigSchema, 
  BaseNodeResponseSchema, 
  BaseNodeErrorSchema 
} from './schema';

// Exportaciones de constantes y configuración
export { 
  BASE_NODE_DEFAULTS, 
  BASE_NODE_METADATA, 
  EXAMPLE_CONFIGS, 
  HELP_CONTENT 
} from './constants';

// Metadata del nodo para registro automático
export const nodeMetadata = {
  type: 'baseNode', // TODO: Cambiar por tipo real
  label: 'Nodo Base', // TODO: Cambiar por label en español
  icon: 'Settings', // TODO: Cambiar por icono apropiado (se convertirá al componente en el registro)
  description: 'Nodo base template para desarrollo', // TODO: Cambiar por descripción real
  category: 'utility', // TODO: Cambiar por categoría apropiada (api, data, utility, etc.)
  version: '1.0.0',
  author: 'CMR System',
  
  // Configuración por defecto para nuevos nodos
  defaultConfig: {
    name: 'Base Node',
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
    hasSettings: true,
    isAsync: true, // TODO: Ajustar si el nodo no es asíncrono
    canFail: true,
    supportsRetry: false, // TODO: Ajustar si soporta reintentos
    supportsTimeout: false, // TODO: Ajustar si soporta timeouts
    supportsVariables: true,
    supportsConnections: false, // TODO: Ajustar si necesita conexiones
  },
  
  // Validación de configuración (función de utilidad)
  validateConfig: validateBaseNodeConfig,
  
  // Configuración por defecto mejorada
  getDefaultConfig: createDefaultBaseNodeConfig,
  
  // Información para el flow builder UI
  builderInfo: {
    color: 'gray', // TODO: Cambiar por color específico del nodo
    borderColor: 'border-gray-500', // TODO: Cambiar por color específico
    textColor: 'text-gray-400', // TODO: Cambiar por color específico
    bgColor: 'bg-gray-50', // TODO: Cambiar por color específico
    darkBgColor: 'bg-gray-900', // TODO: Cambiar por color específico
  }
} as const;

// Re-exportar runner para compatibilidad con FlowExecutor existente
export { executeBaseNode } from './runner';

// Export tipo del metadata para TypeScript
export type BaseNodeMetadata = typeof nodeMetadata;