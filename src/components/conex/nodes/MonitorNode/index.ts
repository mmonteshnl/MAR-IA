// Importaciones necesarias para metadata
import { createDefaultMonitorNodeConfig, validateMonitorNodeConfig } from './runner';

// Exportaciones principales del MonitorNode Template
export { MonitorNode as Component } from './MonitorNode';
export { MonitorNode } from './MonitorNode';
// export { MonitorNodeMonitor as Monitor } from './MonitorNodeMonitor';
export { executeMonitorNode as runner, validateMonitorNodeConfig, createDefaultMonitorNodeConfig } from './runner';

// Exportaciones de tipos y schemas
export type { 
  MonitorNodeConfig, 
  MonitorNodeResponse, 
  MonitorNodeError, 
  MonitorNodeResult, 
  MonitorNodeData 
} from './schema';
export { 
  MonitorNodeConfigSchema, 
  MonitorNodeResponseSchema, 
  MonitorNodeErrorSchema 
} from './schema';

// Exportaciones de constantes y configuración
export { 
  MONITOR_DEFAULTS, 
  MONITOR_METADATA, 
  EXAMPLE_CONFIGS, 
  HELP_CONTENT 
} from './constants';

// Metadata del nodo para registro automático
export const nodeMetadata = {
  type: 'monitor', // TODO: Cambiar por tipo real
  label: 'Monitor de Debug', // TODO: Cambiar por label en español
  icon: 'Monitor', // TODO: Cambiar por icono apropiado (se convertirá al componente en el registro)
  description: 'Monitor de Debug - Nodo para utility', // TODO: Cambiar por descripción real
  category: 'utility', // TODO: Cambiar por categoría apropiada (api, data, utility, etc.)
  version: '1.0.0',
  author: 'CMR System',
  
  // Configuración por defecto para nuevos nodos
  defaultConfig: {
    name: 'Monitor de Debug',
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
    hasMonitor: true,
    isAsync: true, // TODO: Ajustar si el nodo no es asíncrono
    canFail: true,
    supportsRetry: false, // TODO: Ajustar si soporta reintentos
    supportsTimeout: false, // TODO: Ajustar si soporta timeouts
    supportsVariables: true,
    supportsConnections: false, // TODO: Ajustar si necesita conexiones
  },
  
  // Validación de configuración (función de utilidad)
  validateConfig: validateMonitorNodeConfig,
  
  // Configuración por defecto mejorada
  getDefaultConfig: createDefaultMonitorNodeConfig,
  
  // Información para el flow builder UI
  builderInfo: {
    color: 'gray', // TODO: Cambiar por color específico del nodo
    borderColor: 'border-purple-500', // TODO: Cambiar por color específico
    textColor: 'text-purple-400', // TODO: Cambiar por color específico
    bgColor: 'bg-purple-50', // TODO: Cambiar por color específico
    darkBgColor: 'bg-purple-900', // TODO: Cambiar por color específico
  }
} as const;

// Re-exportar runner para compatibilidad con FlowExecutor existente
export { executeMonitorNode } from './runner';

// Export tipo del metadata para TypeScript
export type MonitorNodeMetadata = typeof nodeMetadata;