import { z } from 'zod';

// Schema de validación para configuración del nodo Trigger
export const TriggerNodeConfigSchema = z.object({
  name: z.string().optional().default('Disparador'),
  description: z.string().optional().default('Punto de inicio del flujo'),
});

// Tipos derivados del schema
export type TriggerNodeConfig = z.infer<typeof TriggerNodeConfigSchema>;

// Schema para respuesta del nodo Trigger
export const TriggerNodeResponseSchema = z.object({
  success: z.boolean(),
  triggerData: z.any(),
  leadData: z.any().optional(),
  timestamp: z.string(),
  executionId: z.string().optional(),
});

export type TriggerNodeResponse = z.infer<typeof TriggerNodeResponseSchema>;

// Schema para errores del nodo Trigger
export const TriggerNodeErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.string().optional(),
  timestamp: z.string(),
});

export type TriggerNodeError = z.infer<typeof TriggerNodeErrorSchema>;

// Union type para respuesta completa
export type TriggerNodeResult = TriggerNodeResponse | TriggerNodeError;

// Metadata del nodo
export interface TriggerNodeData {
  config: TriggerNodeConfig;
  meta?: {
    status?: 'idle' | 'loading' | 'success' | 'error';
    lastExecution?: string;
    executionCount?: number;
    // TODO: Agregar metadata específica aquí
  };
}