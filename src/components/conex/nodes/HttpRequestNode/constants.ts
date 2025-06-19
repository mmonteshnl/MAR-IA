import { Globe } from 'lucide-react';
import { HttpRequestConfig } from './schema';

// Configuración por defecto del nodo
export const HTTP_REQUEST_DEFAULTS: HttpRequestConfig = {
  name: 'HTTP Request',
  method: 'GET',
  url: 'https://api.ejemplo.com/endpoint',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: {},
  timeout: 30,
  retries: 1,
  followRedirects: true,
  validateSSL: true,
};

// Metadatos del nodo
export const HTTP_REQUEST_METADATA = {
  type: 'httpRequest',
  label: 'HTTP Request',
  icon: Globe,
  description: 'Peticiones HTTP avanzadas con reintentos y timeouts',
  category: 'api',
  version: '1.0.0',
  author: 'CMR System',
} as const;

// Colores para métodos HTTP
export const METHOD_COLORS = {
  GET: 'text-green-400',
  POST: 'text-blue-400',
  PUT: 'text-yellow-400',
  DELETE: 'text-red-400',
  PATCH: 'text-purple-400',
} as const;

// Headers comunes predefinidos
export const COMMON_HEADERS = {
  'Content-Type': [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
    'text/html',
    'application/xml',
  ],
  'Accept': [
    'application/json',
    'application/xml',
    'text/html',
    'text/plain',
    '*/*',
  ],
  'Authorization': [
    'Bearer {{token}}',
    'Basic {{credentials}}',
    'API-Key {{apiKey}}',
  ],
} as const;

// Templates de ejemplo
export const EXAMPLE_CONFIGS = {
  simpleGet: {
    name: 'API Simple GET',
    method: 'GET' as const,
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: {
      'Accept': 'application/json'
    },
    timeout: 15,
    retries: 2,
  },
  postWithAuth: {
    name: 'API POST con Autenticación',
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
  },
  webhook: {
    name: 'Webhook Notification',
    method: 'POST' as const,
    url: 'https://hooks.slack.com/services/{{config.webhookPath}}',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      text: 'Nuevo lead: {{trigger.input.leadName}}',
      channel: '#leads',
      username: 'CRM Bot'
    },
    timeout: 15,
    retries: 1,
  },
} as const;

// Configuración de ayuda y documentación
export const HELP_CONTENT = {
  nodeType: 'httpRequest',
  title: 'Nodo HTTP Avanzado',
  description: 'Realiza peticiones HTTP avanzadas con REST APIs, autenticación, retries y manejo de errores.',
  usage: [
    'Soporta GET, POST, PUT, DELETE, PATCH',
    'Headers personalizados y autenticación',
    'Manejo de JSON, XML y texto plano',
    'Timeout configurable y reintentos automáticos',
    'Transformación de respuestas',
  ],
  examples: [
    `// API GitHub – Listar repos
URL: https://api.github.com/user/repos
Método: GET
Headers: {
  "Authorization": "Bearer {{connections.github.token}}",
  "Accept": "application/vnd.github.v3+json"
}
Timeout: 30s
Reintentos: 2`,
    `// Webhook Slack
URL: https://hooks.slack.com/services/{{config.webhookPath}}
Método: POST
Body: {
  "text": "Lead {{trigger.input.leadName}} calificado",
  "attachments": [{
    "color": "good",
    "fields": [
      {"title": "Email", "value": "{{trigger.input.leadEmail}}"},
      {"title": "Valor", "value": "{{trigger.input.leadValue}}"}
    ]
  }]
}
Timeout: 15s`,
  ],
  tips: [
    'Usa timeout para APIs lentas (máx 300s)',
    'Configura reintentos para endpoints inestables',
    'Incluye Accept y Content-Type adecuados',
    'Emplea variables dinámicas en payloads',
    'Captura y muestra errores con MonitorNode',
  ],
} as const;