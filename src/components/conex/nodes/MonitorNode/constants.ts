import { Monitor } from 'lucide-react';
import { MonitorNodeConfig } from './schema';

// Configuración por defecto del nodo
export const MONITOR_DEFAULTS: MonitorNodeConfig = {
  name: 'Debug Monitor',
  displayFields: '',
  outputFormat: 'json',
  enableTimestamp: true,
};

// Metadatos del nodo
export const MONITOR_METADATA = {
  type: 'monitor',
  label: 'Monitor de Debug',
  icon: Monitor,
  description: 'Captura y muestra datos del flujo en la consola para debugging',
  category: 'utility',
  version: '1.0.0',
  author: 'CMR System',
} as const;

// Formatos de salida disponibles
export const OUTPUT_FORMATS = {
  json: {
    label: 'JSON Pretty',
    description: 'Formato JSON legible con indentación',
    icon: '📋'
  },
  table: {
    label: 'Tabla',
    description: 'Formato de tabla con columnas',
    icon: '📊'
  },
  list: {
    label: 'Lista Simple',
    description: 'Lista de elementos con bullets',
    icon: '📝'
  }
} as const;

// Configuraciones de ejemplo predefinidas
export const EXAMPLE_CONFIGS = {
  basic: {
    name: 'Debug Básico',
    displayFields: '',
    outputFormat: 'json' as const,
    enableTimestamp: true,
  },
  filtered: {
    name: 'Debug Filtrado',
    displayFields: 'leadName,leadEmail,leadValue',
    outputFormat: 'table' as const,
    enableTimestamp: true,
  },
  detailed: {
    name: 'Debug Detallado',
    displayFields: 'trigger.input,step_api-call-1.response',
    outputFormat: 'json' as const,
    enableTimestamp: true,
  },
} as const;

// Configuración de ayuda y documentación
export const HELP_CONTENT = {
  nodeType: 'monitor',
  title: 'Nodo Monitor - Tu "Monito" de Debug',
  description: 'Captura y muestra datos del flujo en la consola del navegador. Perfecto para debugging y verificar que todo funcione correctamente.',
  usage: [
    'Intercepta datos sin afectar el flujo',
    'Muestra información en la consola del navegador',
    'Permite filtrar campos específicos',
    'Soporta diferentes formatos de salida',
    'Incluye timestamps para seguimiento'
  ],
  examples: [
    `// Configuración básica:
Nombre: "Debug Lead Data"
Campos: "leadName,leadEmail,leadValue"
Formato: JSON
Timestamp: ✓ Activado`,
    `// Lo que verás en la consola:
🔍 MONITOR: Debug Lead Data
⏰ Timestamp: 2025-01-18T18:23:45.123Z
📦 Datos capturados:
{
  "leadName": "TechStart Solutions",
  "leadEmail": "contacto@techstart.com",
  "leadValue": 15000
}`
  ],
  tips: [
    'Abre la consola del navegador (F12) para ver los datos',
    'Deja "Campos" vacío para ver toda la información',
    'Úsalo después de APIs para verificar respuestas',
    'Ideal para encontrar errores en el flujo'
  ]
} as const;