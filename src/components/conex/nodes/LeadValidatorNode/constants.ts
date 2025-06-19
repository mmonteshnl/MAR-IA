import { User } from 'lucide-react'; // TODO: Cambiar por icono apropiado
import { LeadValidatorNodeConfig } from './schema';

// Configuración por defecto del nodo
export const LEAD_VALIDATOR_DEFAULTS: LeadValidatorNodeConfig = {
  name: 'Validador de Leads',
  // TODO: Agregar configuración por defecto específica aquí
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
  basic: {
    name: 'Configuración Básica',
    // TODO: Agregar configuración de ejemplo básica
  },
  advanced: {
    name: 'Configuración Avanzada',
    // TODO: Agregar configuración de ejemplo avanzada
  },
} as const;

// Configuración de ayuda y documentación
export const HELP_CONTENT = {
  nodeType: 'leadValidator', // TODO: Cambiar por tipo real
  title: 'Validador de Leads Template',
  description: 'Validador de Leads proporciona funcionalidad de data. Reemplazar con descripción real.',
  usage: [
    'Funcionalidad principal del nodo',
    'Segunda característica importante',
    'Tercera característica útil',
    // TODO: Agregar características reales aquí
  ],
  examples: [
    `// Ejemplo básico
Configuración: {
  name: "Mi Nodo",
  // TODO: Agregar ejemplo real
}`,
    `// Ejemplo avanzado
Configuración: {
  name: "Mi Nodo Avanzado",
  // TODO: Agregar ejemplo avanzado real
}`,
  ],
  tips: [
    'Tip importante para usar este nodo',
    'Consideración de rendimiento',
    'Mejores prácticas de configuración',
    // TODO: Agregar tips reales aquí
  ],
} as const;