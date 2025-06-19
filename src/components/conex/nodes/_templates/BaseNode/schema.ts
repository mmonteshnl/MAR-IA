import { z } from 'zod';

// Schema de validación para configuración del nodo base
export const BaseNodeConfigSchema = z.object({
  name: z.string().optional().default('Base Node'),
  // TODO: Agregar campos específicos del nodo aquí
  // ejemplo: url: z.string().url().optional(),
  // ejemplo: timeout: z.number().min(1).max(300).optional().default(30),
});

// Tipos derivados del schema
export type BaseNodeConfig = z.infer<typeof BaseNodeConfigSchema>;

// Schema para respuesta del nodo base
export const BaseNodeResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  timestamp: z.string(),
  // TODO: Agregar campos específicos de respuesta aquí
});

export type BaseNodeResponse = z.infer<typeof BaseNodeResponseSchema>;

// Schema para errores del nodo base
export const BaseNodeErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.string().optional(),
  timestamp: z.string(),
  // TODO: Agregar campos específicos de error aquí
});

export type BaseNodeError = z.infer<typeof BaseNodeErrorSchema>;

// Union type para respuesta completa
export type BaseNodeResult = BaseNodeResponse | BaseNodeError;

// Metadata del nodo
export interface BaseNodeData {
  config: BaseNodeConfig;
  meta?: {
    status?: 'idle' | 'loading' | 'success' | 'error';
    lastExecution?: string;
    executionCount?: number;
    // TODO: Agregar metadata específica aquí
  };
}