// DataFetcherNode/index.ts
export { DataFetcherNode as Component } from './DataFetcherNode';
export { DataFetcherNodeSettings as User } from './DataFetcherNodeSettings';
export { runDataFetcherNode as runner } from './runner';
export { useDataFetcherExecution } from './useDataFetcherExecution';
export type {
  DataFetcherNodeConfig,
  DataFetcherNodeData
} from './schema';
export {
  DataFetcherNodeConfigSchema,
  DataFetcherNodeDataSchema
} from './schema';
export { DATA_FETCHER_DEFAULTS, HELP_CONTENT } from './constants';

// Metadata del nodo para registro automático
export const nodeMetadata = {
  type: 'dataFetcher',
  label: 'Obtener Datos',
  icon: 'Database',
  description: 'Obtiene datos de la base de datos por ID, rango o todos',
  category: 'data',
  version: '1.0.0',
  author: 'CMR System',
  
  // Configuración por defecto para nuevos nodos
  defaultConfig: {
    name: 'Obtener Datos',
    fetchMode: 'all',
    collection: 'leads',
    enableLogging: true
  },
  
  // Tags para búsqueda y categorización
  tags: [
    'database', 'fetch', 'data', 'query', 'leads', 'collection'
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
    supportsTimeout: true,
    supportsVariables: true,
    supportsConnections: false,
    supportsMultipleOutputs: false,
    supportsDatabaseWrites: false
  },
  
  // Información para el flow builder UI
  builderInfo: {
    color: 'blue',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-50',
    darkBgColor: 'bg-blue-900',
  }
} as const;

export type DataFetcherNodeMetadata = typeof nodeMetadata;