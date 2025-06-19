import { z } from 'zod';

export const DataTransformNodeConfigSchema = z.object({
  name: z.string().default('Transformar'),
  transformations: z.array(z.object({
    id: z.string(),
    sourceField: z.string().describe('Campo origen usando notación de puntos, ej: step_nodeId.response.data.name'),
    targetField: z.string().describe('Campo destino, ej: nombreCompleto'),
    transform: z.enum(['copy', 'format', 'map', 'extract', 'combine']).default('copy'),
    formatTemplate: z.string().optional().describe('Template para formateo, ej: "{{firstName}} {{lastName}}"'),
    mapping: z.record(z.any()).optional().describe('Mapeo para transformación de valores'),
    extractPath: z.string().optional().describe('Ruta para extraer de objetos anidados'),
    combineFields: z.array(z.string()).optional().describe('Campos a combinar'),
    combineTemplate: z.string().optional().describe('Template para combinación'),
  })).default([]),
  outputName: z.string().default('transformedData').describe('Nombre del objeto de salida'),
  preserveOriginal: z.boolean().default(false).describe('Mantener datos originales además de los transformados'),
});

export const DataTransformNodeDataSchema = z.object({
  config: DataTransformNodeConfigSchema,
  meta: z.object({
    status: z.enum(['idle', 'loading', 'success', 'error']).optional(),
    lastExecution: z.string().optional(),
    executionCount: z.number().optional(),
    lastResult: z.any().optional(),
    lastError: z.string().optional(),
    transformationsApplied: z.number().optional(),
  }).optional(),
});

export type DataTransformNodeConfig = z.infer<typeof DataTransformNodeConfigSchema>;
export type DataTransformNodeData = z.infer<typeof DataTransformNodeDataSchema>;