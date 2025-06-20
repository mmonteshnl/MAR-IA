// LogicGateNode/index.ts
export { LogicGateNode as Component } from './LogicGateNode';
export { LogicGateNodeSettings as User } from './LogicGateNodeSettings';
export { runLogicGateNode as runner } from './runner';
export type {
  LogicGateNodeConfig,
  LogicGateNodeData
} from './schema';
export {
  LogicGateNodeConfigSchema,
  LogicGateNodeDataSchema
} from './schema';
export { LOGIC_GATE_DEFAULTS, HELP_CONTENT } from './constants';

// Metadata del nodo para registro automático
export const nodeMetadata = {
  type: 'logicGate',
  label: 'Compuerta Lógica',
  icon: 'Settings',
  description: 'Realiza operaciones lógicas básicas entre valores booleanos',
  category: 'validation',
  version: '1.0.0',
  author: 'CMR System',
  
  // Configuración por defecto para nuevos nodos
  defaultConfig: {
    name: 'Compuerta Lógica',
    gateType: 'AND'
  },
  
  // Tags para búsqueda y categorización
  tags: [
    'logic', 'boolean', 'validation', 'gate', 'AND', 'OR', 'NOT'
  ],
  
  // Capabilities del nodo
  capabilities: {
    hasInput: true,
    hasOutput: true,
    hasConfig: true,
    hasUser: true,
    isAsync: false,
    canFail: true,
    supportsRetry: false,
    supportsTimeout: false,
    supportsVariables: true,
    supportsConnections: false,
    supportsMultipleOutputs: false,
    supportsDatabaseWrites: false
  },
  
  // Información para el flow builder UI
  builderInfo: {
    color: 'red',
    borderColor: 'border-red-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-50',
    darkBgColor: 'bg-red-900',
  }
} as const;

export type LogicGateNodeMetadata = typeof nodeMetadata;