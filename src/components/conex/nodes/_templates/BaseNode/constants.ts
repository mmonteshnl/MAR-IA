import { Settings } from 'lucide-react'; // TODO: Cambiar por icono apropiado
import { BaseNodeConfig } from './schema';

// Configuración por defecto del nodo
export const BASE_NODE_DEFAULTS: BaseNodeConfig = {
  name: 'Base Node',
  // TODO: Agregar configuración por defecto específica aquí
};

// Metadatos del nodo
export const BASE_NODE_METADATA = {
  type: 'baseNode', // TODO: Cambiar por tipo real
  label: 'Nodo Base', // TODO: Cambiar por label en español
  icon: Settings, // TODO: Cambiar por icono apropiado
  description: 'Nodo base template para desarrollo', // TODO: Cambiar por descripción real
  category: 'utility', // TODO: Cambiar por categoría apropiada (api, data, utility, etc.)
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
  nodeType: 'baseNode', // TODO: Cambiar por tipo real
  title: 'Nodo Base Template',
  description: 'Este es un nodo template para desarrollo. Reemplazar con descripción real.',
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