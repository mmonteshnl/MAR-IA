import { z } from 'zod';

// Modos de obtención de datos
export const FetchModes = ['all', 'byId', 'byRange'] as const;
export type FetchMode = typeof FetchModes[number];

// Schema para configuración de rango
export const RangeConfigSchema = z.object({
  limit: z.number().min(1).max(1000).default(10).describe('Número máximo de registros a obtener'),
  offset: z.number().min(0).default(0).describe('Número de registros a saltar'),
  sortBy: z.string().optional().describe('Campo por el cual ordenar'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Orden de clasificación'),
});

// Schema principal de configuración
export const DataFetcherNodeConfigSchema = z.object({
  name: z.string().default('Obtener Datos').describe('Nombre del nodo'),
  
  // Modo de obtención
  fetchMode: z.enum(FetchModes).default('all').describe('Modo de obtención de datos'),
  
  // Configuración de base de datos
  collection: z.string().default('leads').describe('Colección/tabla de la base de datos'),
  
  // Configuración para modo byId
  targetId: z.string().optional().describe('ID específico a buscar (para modo byId)'),
  idField: z.string().default('id').describe('Campo que contiene el ID'),
  
  // Configuración para modo byRange
  rangeConfig: RangeConfigSchema.optional().describe('Configuración para obtener por rango'),
  
  // Filtros adicionales
  filters: z.record(z.any()).optional().describe('Filtros adicionales para la consulta'),
  
  // Configuración general
  enableLogging: z.boolean().default(true).describe('Habilitar logs de depuración'),
  timeout: z.number().min(1000).max(60000).default(10000).describe('Timeout en milisegundos'),
  
  // Configuración de salida
  includeMetadata: z.boolean().default(true).describe('Incluir metadata en la respuesta'),
  flattenResults: z.boolean().default(false).describe('Aplanar resultados en un array simple'),
});

export const DataFetcherNodeDataSchema = z.object({
  config: DataFetcherNodeConfigSchema,
  meta: z.object({
    status: z.enum(['idle', 'loading', 'success', 'error']).optional(),
    lastExecution: z.string().optional(),
    executionCount: z.number().optional(),
    lastResultCount: z.number().optional(),
    lastError: z.string().optional(),
    averageExecutionTime: z.number().optional(),
  }).optional(),
});

export type DataFetcherNodeConfig = z.infer<typeof DataFetcherNodeConfigSchema>;
export type DataFetcherNodeData = z.infer<typeof DataFetcherNodeDataSchema>;
export type RangeConfig = z.infer<typeof RangeConfigSchema>;

// Tipos para el contexto y resultado
export interface DataFetcherContext {
  variables: Record<string, any>;
  input?: {
    id?: string;
    filters?: Record<string, any>;
    [key: string]: any;
  };
}

export interface DataFetcherResult {
  success: boolean;
  data?: any[];
  count?: number;
  metadata?: {
    collection: string;
    fetchMode: FetchMode;
    executionTime: number;
    filters?: Record<string, any>;
    totalResults?: number;
  };
  error?: string;
  timestamp: string;
}