import { DataTransformNodeConfig } from './schema';

export const DATA_TRANSFORM_NODE_DEFAULTS: DataTransformNodeConfig = {
  name: 'Transformar',
  transformations: [],
  outputName: 'transformedData',
  preserveOriginal: false,
};

export const HELP_CONTENT = {
  nodeType: 'dataTransform',
  title: 'Nodo Transformador de Datos',
  description: 'Transforma y reestructura datos JSON de nodos anteriores. Ideal para formatear información antes del siguiente paso.',
  usage: [
    'Recibe datos de nodos anteriores',
    'Aplica transformaciones JSON definidas',
    'Mapea campos a nuevos nombres',
    'Extrae valores específicos de objetos complejos',
    'Prepara datos para el siguiente nodo'
  ],
  examples: [
    `// Transformación básica:
Origen: step_api-call-1
Destino: datosLimpios
Mapeo: {
  "nombre": "name",
  "telefono": "phone", 
  "ubicacion": "address.city"
}`,
    `// Resultado de la transformación:
{
  "datosLimpios": {
    "nombre": "Juan Pérez",
    "telefono": "+1234567890",
    "ubicacion": "Madrid"
  }
}`
  ],
  tips: [
    'Usa notación de puntos para datos anidados',
    'Puedes crear múltiples transformaciones',
    'Ideal para limpiar respuestas de APIs',
    'Combina datos de diferentes fuentes'
  ]
};

export const TRANSFORM_TYPES = {
  copy: {
    label: 'Copiar',
    description: 'Copia el valor sin modificar',
    icon: '📋',
  },
  format: {
    label: 'Formatear',
    description: 'Aplica un template de formato',
    icon: '🎨',
  },
  map: {
    label: 'Mapear',
    description: 'Mapea valores usando un diccionario',
    icon: '🗺️',
  },
  extract: {
    label: 'Extraer',
    description: 'Extrae valor de objeto anidado',
    icon: '🔍',
  },
  combine: {
    label: 'Combinar',
    description: 'Combina múltiples campos',
    icon: '🔗',
  },
};

export const COMMON_TRANSFORMATIONS = [
  {
    name: 'Nombre Completo',
    sourceField: 'response.firstName',
    targetField: 'nombreCompleto',
    transform: 'format' as const,
    formatTemplate: '{{response.firstName}} {{response.lastName}}',
  },
  {
    name: 'Email Normalizado',
    sourceField: 'response.email',
    targetField: 'email',
    transform: 'copy' as const,
  },
  {
    name: 'Estado Mapeado',
    sourceField: 'response.status',
    targetField: 'estado',
    transform: 'map' as const,
    mapping: {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'pending': 'Pendiente',
    },
  },
];