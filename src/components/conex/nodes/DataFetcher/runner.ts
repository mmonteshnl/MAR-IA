import { 
  DataFetcherNodeConfig, 
  DataFetcherContext, 
  DataFetcherResult,
  DataFetcherNodeConfigSchema 
} from './schema';
import { dataFetcherClient } from '@/lib/datafetcher-client';

// Interface para compatibilidad con el sistema existente
interface DatabaseManager {
  getAll: (collection: string, filters?: Record<string, any>) => Promise<any[]>;
  getById: (collection: string, id: string, idField?: string) => Promise<any | null>;
  getByRange: (
    collection: string, 
    options: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: Record<string, any>;
    }
  ) => Promise<{ data: any[]; total: number }>;
}

// Runner principal para el DataFetcherNode usando Firebase
export async function runDataFetcherNode(
  config: unknown,
  context: DataFetcherContext,
  databaseManager?: DatabaseManager
): Promise<DataFetcherResult> {
  const startTime = Date.now();
  
  try {
    // Validar configuración
    const parsedConfig = DataFetcherNodeConfigSchema.safeParse(config);
    if (!parsedConfig.success) {
      throw new Error(`Configuración inválida: ${parsedConfig.error.message}`);
    }

    const validConfig = parsedConfig.data;

    if (validConfig.enableLogging) {
      console.log(`🔍 DATA FETCHER: Ejecutando ${validConfig.name} en modo ${validConfig.fetchMode}`);
    }

    // Resolver variables dinámicas
    const resolvedConfig = resolveVariables(validConfig, context);

    // Usar Firebase DataService en lugar del mock
    const useFirebase = !databaseManager; // Si no hay mock, usar Firebase real

    let data: any[] = [];
    let totalResults = 0;

    if (useFirebase) {
      // Usar cliente Firebase real
      const fetchParams = {
        collection: resolvedConfig.collection,
        fetchMode: resolvedConfig.fetchMode,
        targetId: resolvedConfig.targetId,
        organizationId: context.variables?.organizationId,
        userId: context.variables?.userId,
        filters: resolvedConfig.filters,
        limit: resolvedConfig.rangeConfig?.limit || 10,
        offset: resolvedConfig.rangeConfig?.offset || 0,
        orderBy: resolvedConfig.rangeConfig?.sortBy ? {
          field: resolvedConfig.rangeConfig.sortBy,
          direction: resolvedConfig.rangeConfig.sortOrder || 'desc'
        } : undefined
      };

      const result = await dataFetcherClient.fetchData(fetchParams);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener datos de Firebase');
      }
      
      data = result.data || [];
      totalResults = result.total || 0;
    } else {
      // Usar mock para testing (código original)
      switch (resolvedConfig.fetchMode) {
        case 'all':
          data = await databaseManager.getAll(
            resolvedConfig.collection, 
            resolvedConfig.filters
          );
          totalResults = data.length;
          break;

        case 'byId':
          if (!resolvedConfig.targetId) {
            throw new Error('ID objetivo requerido para modo byId');
          }
          
          const singleResult = await databaseManager.getById(
            resolvedConfig.collection,
            resolvedConfig.targetId,
            resolvedConfig.idField
          );
          
          data = singleResult ? [singleResult] : [];
          totalResults = data.length;
          break;

        case 'byRange':
          const rangeOptions = {
            limit: resolvedConfig.rangeConfig?.limit || 10,
            offset: resolvedConfig.rangeConfig?.offset || 0,
            sortBy: resolvedConfig.rangeConfig?.sortBy,
            sortOrder: resolvedConfig.rangeConfig?.sortOrder || 'desc',
            filters: { ...resolvedConfig.filters }
          };

          const rangeResult = await databaseManager.getByRange(
            resolvedConfig.collection,
            rangeOptions
          );
          
          data = rangeResult.data;
          totalResults = rangeResult.total;
          break;

        default:
          throw new Error(`Modo de fetch no soportado: ${resolvedConfig.fetchMode}`);
      }
    }

    // Procesar resultados
    const processedData = resolvedConfig.flattenResults ? 
      flattenArray(data) : data;

    const result: DataFetcherResult = {
      success: true,
      data: processedData,
      count: data.length,
      timestamp: new Date().toISOString()
    };

    // Agregar metadata si está habilitado
    if (resolvedConfig.includeMetadata) {
      result.metadata = {
        collection: resolvedConfig.collection,
        fetchMode: resolvedConfig.fetchMode,
        executionTime: Date.now() - startTime,
        totalResults,
        filters: resolvedConfig.filters
      };
    }

    if (validConfig.enableLogging) {
      console.log(`✅ DATA FETCHER: Obtenidos ${data.length} registros en ${Date.now() - startTime}ms`);
    }

    return result;

  } catch (error) {
    const errorResult: DataFetcherResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido en Data Fetcher',
      timestamp: new Date().toISOString()
    };

    console.error('❌ DATA FETCHER: Error:', errorResult.error);
    return errorResult;
  }
}

// Resolver variables dinámicas en la configuración
function resolveVariables(
  config: DataFetcherNodeConfig, 
  context: DataFetcherContext
): DataFetcherNodeConfig {
  const resolved = { ...config };

  // Resolver ID desde variables o input
  if (config.fetchMode === 'byId') {
    if (!resolved.targetId && context.input?.id) {
      resolved.targetId = context.input.id;
    }
    
    // Resolver variables del tipo {{variableName}}
    if (resolved.targetId && resolved.targetId.includes('{{')) {
      resolved.targetId = interpolateVariables(resolved.targetId, context.variables);
    }
  }

  // Resolver filtros desde input
  if (context.input?.filters) {
    resolved.filters = {
      ...resolved.filters,
      ...context.input.filters
    };
  }

  return resolved;
}

// Interpolar variables en strings
function interpolateVariables(str: string, variables: Record<string, any>): string {
  return str.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const value = getNestedValue(variables, varName.trim());
    return value !== undefined ? String(value) : match;
  });
}

// Obtener valor anidado de un objeto
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Aplanar array de objetos
function flattenArray(data: any[]): any[] {
  return data.flat();
}

// Función para probar conexión con Firebase
export async function testDataFetcherConnection(
  collection: string,
  organizationId?: string,
  userId?: string
): Promise<{
  success: boolean;
  sampleData: any[];
  totalCount: number;
  collectionInfo?: any;
  error?: string;
}> {
  try {
    const result = await dataFetcherClient.testConnection(collection, organizationId, userId);
    return result;
  } catch (error) {
    return {
      success: false,
      sampleData: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Función para obtener colecciones disponibles
export async function getAvailableCollections() {
  try {
    return await dataFetcherClient.getAvailableCollections();
  } catch (error) {
    console.error('Error getting available collections:', error);
    return {
      standard: [],
      organizational: []
    };
  }
}

// Función para obtener schema de una colección
export async function getCollectionSchema(
  collection: string,
  organizationId?: string,
  userId?: string
): Promise<{
  fields: string[];
  sampleValues: Record<string, any>;
}> {
  try {
    const result = await dataFetcherClient.getCollectionSchema(collection, organizationId, userId);
    return {
      fields: result.fields,
      sampleValues: result.sampleValues
    };
  } catch (error) {
    console.error('Error getting collection schema:', error);
    return {
      fields: [],
      sampleValues: {}
    };
  }
}

// Función helper para crear instancia mock de DatabaseManager (para testing)
export function createMockDatabaseManager(mockData: Record<string, any[]>): DatabaseManager {
  return {
    async getAll(collection: string, filters?: Record<string, any>) {
      let data = mockData[collection] || [];
      
      if (filters) {
        data = data.filter(item => {
          return Object.entries(filters).every(([key, value]) => {
            return item[key] === value;
          });
        });
      }
      
      return data;
    },

    async getById(collection: string, id: string, idField = 'id') {
      const data = mockData[collection] || [];
      return data.find(item => item[idField] === id) || null;
    },

    async getByRange(collection: string, options) {
      let data = mockData[collection] || [];
      const { limit = 10, offset = 0, sortBy, sortOrder = 'desc', filters } = options;
      
      // Aplicar filtros
      if (filters) {
        data = data.filter(item => {
          return Object.entries(filters).every(([key, value]) => {
            return item[key] === value;
          });
        });
      }
      
      // Ordenar
      if (sortBy) {
        data.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
      }
      
      const total = data.length;
      const paginatedData = data.slice(offset, offset + limit);
      
      return { data: paginatedData, total };
    }
  };
}