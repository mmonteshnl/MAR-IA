import { DataFetcherNodeConfig } from './schema';

export const DATA_FETCHER_DEFAULTS: DataFetcherNodeConfig = {
  name: 'Obtener Datos',
  fetchMode: 'all',
  collection: 'leads-flow',  // Usar sistema unificado por defecto
  idField: 'id',
  rangeConfig: {
    limit: 10,
    offset: 0,
    sortBy: 'updatedAt',  // Cambiar a updatedAt que es más común
    sortOrder: 'desc'
  },
  enableLogging: true,
  timeout: 10000,
  includeMetadata: true,
  flattenResults: false,
};

// Configuraciones de ejemplo predefinidas
export const EXAMPLE_CONFIGS = {
  getAllLeads: {
    name: 'Obtener Todos los Leads Unificados',
    fetchMode: 'all' as const,
    collection: 'leads-flow',
    enableLogging: true,
    includeMetadata: true
  },
  getLeadById: {
    name: 'Obtener Lead por ID',
    fetchMode: 'byId' as const,
    collection: 'leads-flow',
    targetId: '{{leadId}}',
    idField: 'id',
    enableLogging: true
  },
  getRecentLeads: {
    name: 'Obtener Leads Recientes',
    fetchMode: 'byRange' as const,
    collection: 'leads-flow',
    rangeConfig: {
      limit: 20,
      offset: 0,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const
    },
    enableLogging: true
  },
  getPremiumLeads: {
    name: 'Obtener Leads Premium Activos',
    fetchMode: 'byRange' as const,
    collection: 'leads-flow',
    filters: {
      'lead.context': 'premium',
      'flowStatus': 'active'
    },
    rangeConfig: {
      limit: 50,
      offset: 0,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const
    },
    enableLogging: true
  },
  getProducts: {
    name: 'Obtener Productos Activos',
    fetchMode: 'byRange' as const,
    collection: 'userProducts',
    filters: {
      'isActive': true
    },
    rangeConfig: {
      limit: 30,
      offset: 0,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const
    },
    enableLogging: true
  },
  getTrackingLinks: {
    name: 'Obtener Enlaces de Seguimiento',
    fetchMode: 'byRange' as const,
    collection: 'trackingLinks',
    filters: {
      'isActive': true
    },
    rangeConfig: {
      limit: 25,
      offset: 0,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const
    },
    enableLogging: true
  }
} as const;

export const HELP_CONTENT = {
  nodeType: 'dataFetcher',
  title: 'Obtener Datos',
  description: 'Obtiene datos de la base de datos usando diferentes modos: todos los registros, por ID específico o por rango con filtros.',
  usage: [
    'Modo "Todos": Obtiene todos los registros de la colección',
    'Modo "Por ID": Busca un registro específico usando su ID',
    'Modo "Por Rango": Obtiene un número limitado de registros con paginación',
    'Configura filtros adicionales para refinar los resultados',
    'Los resultados incluyen metadata opcional con información de la consulta'
  ],
  examples: [
    `// Obtener todos los leads
{
  fetchMode: "all",
  collection: "leads"
}`,
    `// Obtener lead específico
{
  fetchMode: "byId",
  collection: "leads",
  targetId: "lead-123"
}`,
    `// Obtener leads recientes (paginado)
{
  fetchMode: "byRange",
  collection: "leads",
  rangeConfig: {
    limit: 10,
    offset: 0,
    sortBy: "createdAt",
    sortOrder: "desc"
  }
}`,
    `// Obtener leads con filtros
{
  fetchMode: "byRange",
  collection: "leads",
  filters: { context: "premium" },
  rangeConfig: { limit: 20 }
}`
  ],
  tips: [
    'Usa variables dinámicas para IDs: {{leadId}} en lugar de valores hardcodeados',
    'El modo "Por Rango" es ideal para paginación y listas grandes',
    'Configura filtros para consultas específicas (ej: leads premium)',
    'Habilita metadata para debugging y análisis de performance',
    'Ajusta el timeout según el tamaño esperado de los datos'
  ],
} as const;