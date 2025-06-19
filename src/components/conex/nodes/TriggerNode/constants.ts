import { Zap } from 'lucide-react';
import { TriggerNodeConfig } from './schema';

// Configuración por defecto del nodo
export const TRIGGER_DEFAULTS: TriggerNodeConfig = {
  name: 'Disparador',
  description: 'Punto de inicio del flujo',
};

// Metadatos del nodo
export const TRIGGER_METADATA = {
  type: 'trigger',
  label: 'Disparador Manual',
  icon: Zap,
  description: 'Punto de inicio del flujo de automatización. Recibe los datos iniciales cuando se ejecuta el flujo.',
  category: 'utility',
  version: '1.0.0',
  author: 'CMR System',
} as const;

// Configuraciones de ejemplo predefinidas
export const EXAMPLE_CONFIGS = {
  basic: {
    name: 'Disparador Básico',
    description: 'Inicio simple del flujo',
  },
  named: {
    name: 'Inicio de Proceso de Lead',
    description: 'Recibe datos del lead para procesamiento',
  },
} as const;

// Configuración de ayuda y documentación
export const HELP_CONTENT = {
  nodeType: 'trigger',
  title: 'Nodo Disparador Manual',
  description: 'Punto de inicio del flujo de automatización. Recibe los datos iniciales cuando se ejecuta el flujo.',
  usage: [
    'Es el primer nodo de todo flujo',
    'Recibe datos cuando ejecutas el flujo desde un lead',
    'Proporciona variables del lead como nombre, email, etc.',
    'Se activa manualmente desde las acciones de IA',
    'No necesita configuración especial'
  ],
  examples: [
    `// Datos que recibe automáticamente:
{
  "leadName": "TechStart Solutions",
  "leadEmail": "contacto@techstart.com", 
  "leadIndustry": "Tecnología",
  "leadValue": 15000,
  "leadStage": "Interesado"
}`,
    `// Cómo usar las variables en otros nodos:
{{trigger.input.leadName}} → "TechStart Solutions"
{{trigger.input.leadEmail}} → "contacto@techstart.com"
{{trigger.input.leadValue}} → 15000`
  ],
  tips: [
    'Siempre debe ser el primer nodo de tu flujo',
    'Los datos vienen automáticamente del lead seleccionado',
    'Usa las variables en nodos posteriores',
    'No necesitas configurar nada, solo conectar'
  ]
} as const;