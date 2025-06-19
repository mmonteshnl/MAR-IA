import { z } from 'zod';

// Schema de validación para configuración del Monitor Node
export const MonitorNodeConfigSchema = z.object({
  name: z.string().optional().default('Debug Monitor'),
  displayFields: z.string().optional().default(''),
  outputFormat: z.enum(['json', 'table', 'list']).optional().default('json'),
  enableTimestamp: z.boolean().optional().default(true),
});

// Tipos derivados del schema
export type MonitorNodeConfig = z.infer<typeof MonitorNodeConfigSchema>;

// Schema para respuesta del Monitor Node
export const MonitorNodeResponseSchema = z.object({
  success: z.boolean().default(true),
  monitorName: z.string(),
  timestamp: z.string().optional(),
  dataSnapshot: z.any(),
  formattedOutput: z.string(),
  consoleLog: z.object({
    title: z.string(),
    data: z.any(),
    format: z.string(),
    timestamp: z.string().optional(),
  }),
});

export type MonitorNodeResponse = z.infer<typeof MonitorNodeResponseSchema>;

// Schema para errores del Monitor Node
export const MonitorNodeErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.string().optional(),
  timestamp: z.string(),
});

export type MonitorNodeError = z.infer<typeof MonitorNodeErrorSchema>;

// Union type para respuesta completa
export type MonitorNodeResult = MonitorNodeResponse | MonitorNodeError;

// Metadata del nodo
export interface MonitorNodeData {
  config: MonitorNodeConfig;
  meta?: {
    status?: 'idle' | 'loading' | 'success' | 'error';
    lastExecution?: string;
    executionCount?: number;
    fieldsDisplayed?: number;
    receivedData?: any; // Data received from previous node
    formattedOutput?: string; // Formatted version of the data
  };
}