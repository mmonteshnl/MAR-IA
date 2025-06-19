// Importaciones necesarias para metadata
import { validateHttpRequestConfig, createDefaultHttpRequestConfig } from './runner';

// Exportaciones principales del HttpRequestNode
export { HttpRequestNode as Component } from './HttpRequestNode';
export { HttpRequestSettings as Settings } from './HttpRequestSettings';
export { executeHttpRequest as runner, validateHttpRequestConfig, createDefaultHttpRequestConfig } from './runner';

// Exportaciones de tipos y schemas
export type { 
  HttpRequestConfig, 
  HttpRequestResponse, 
  HttpRequestError, 
  HttpRequestResult, 
  HttpRequestNodeData 
} from './schema';
export { 
  HttpRequestConfigSchema, 
  HttpRequestResponseSchema, 
  HttpRequestErrorSchema 
} from './schema';

// Exportaciones de constantes y configuración
export { 
  HTTP_REQUEST_DEFAULTS, 
  HTTP_REQUEST_METADATA, 
  METHOD_COLORS, 
  COMMON_HEADERS, 
  EXAMPLE_CONFIGS, 
  HELP_CONTENT 
} from './constants';

// Metadata del nodo para registro automático
export const nodeMetadata = {
  type: 'httpRequest',
  label: 'HTTP Request',
  icon: 'Globe', // Se convertirá al componente en el registro
  description: 'Peticiones HTTP avanzadas con reintentos y timeouts',
  category: 'api',
  version: '1.0.0',
  author: 'CMR System',
  
  // Configuración por defecto para nuevos nodos
  defaultConfig: {
    name: 'HTTP Request',
    method: 'GET' as const,
    url: 'https://api.ejemplo.com/endpoint',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 30,
    retries: 1,
  },
  
  // Configuraciones de ejemplo predefinidas
  examples: [
    {
      name: 'GET Simple',
      description: 'Petición GET básica a una API',
      config: {
        name: 'API Simple GET',
        method: 'GET' as const,
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: { 'Accept': 'application/json' },
        timeout: 15,
        retries: 2,
      }
    },
    {
      name: 'POST con Autenticación',
      description: 'Petición POST con Bearer token',
      config: {
        name: 'API POST con Auth',
        method: 'POST' as const,
        url: 'https://api.ejemplo.com/leads',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer {{connections.api.token}}',
          'Accept': 'application/json'
        },
        body: {
          name: '{{trigger.input.leadName}}',
          email: '{{trigger.input.leadEmail}}',
          source: 'CRM'
        },
        timeout: 30,
        retries: 3,
      }
    },
    {
      name: 'Webhook Slack',
      description: 'Notificación via webhook a Slack',
      config: {
        name: 'Slack Notification',
        method: 'POST' as const,
        url: 'https://hooks.slack.com/services/{{config.webhookPath}}',
        headers: { 'Content-Type': 'application/json' },
        body: {
          text: 'Nuevo lead: {{trigger.input.leadName}}',
          channel: '#leads',
          username: 'CRM Bot'
        },
        timeout: 15,
        retries: 1,
      }
    }
  ],
  
  // Tags para búsqueda y categorización
  tags: [
    'http', 'api', 'rest', 'webhook', 'integration', 
    'external', 'network', 'request', 'async'
  ],
  
  // Capabilities del nodo
  capabilities: {
    hasInput: true,
    hasOutput: true,
    hasConfig: true,
    hasSettings: true,
    isAsync: true,
    canFail: true,
    supportsRetry: true,
    supportsTimeout: true,
    supportsVariables: true,
    supportsConnections: true,
  },
  
  // Validación de configuración (función de utilidad)
  validateConfig: validateHttpRequestConfig,
  
  // Configuración por defecto mejorada
  getDefaultConfig: createDefaultHttpRequestConfig,
  
  // Información para el flow builder UI
  builderInfo: {
    color: 'purple',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-50',
    darkBgColor: 'bg-purple-900',
  }
} as const;

// Re-exportar runner para compatibilidad con FlowExecutor existente
export { executeHttpRequest } from './runner';

// Export tipo del metadata para TypeScript
export type HttpRequestNodeMetadata = typeof nodeMetadata;