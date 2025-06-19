import { z } from 'zod';

// Schema de validación para configuración de HTTP Request
export const HttpRequestConfigSchema = z.object({
  name: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  url: z.string().min(1, 'URL es requerida'),
  headers: z.record(z.string(), z.string()).optional().default({}),
  body: z.any().optional(),
  timeout: z.number().min(1).max(300).optional().default(30),
  retries: z.number().min(0).max(10).optional().default(1),
  followRedirects: z.boolean().optional().default(true),
  validateSSL: z.boolean().optional().default(true),
});

// Tipos derivados del schema
export type HttpRequestConfig = z.infer<typeof HttpRequestConfigSchema>;

// Schema para respuesta de HTTP Request
export const HttpRequestResponseSchema = z.object({
  data: z.any(),
  status: z.number(),
  statusText: z.string(),
  headers: z.record(z.string(), z.string()),
  url: z.string(),
  method: z.string(),
  timestamp: z.string(),
  attempt: z.number(),
  duration: z.number().optional(),
});

export type HttpRequestResponse = z.infer<typeof HttpRequestResponseSchema>;

// Schema para errores de HTTP Request
export const HttpRequestErrorSchema = z.object({
  error: z.literal(true),
  status: z.number().optional(),
  message: z.string(),
  details: z.string().optional(),
  url: z.string(),
  method: z.string(),
  timestamp: z.string(),
  attempt: z.number(),
});

export type HttpRequestError = z.infer<typeof HttpRequestErrorSchema>;

// Union type para respuesta completa
export type HttpRequestResult = HttpRequestResponse | HttpRequestError;

// Metadata del nodo
export interface HttpRequestNodeData {
  config: HttpRequestConfig;
  meta?: {
    status?: 'idle' | 'loading' | 'success' | 'error';
    lastExecution?: string;
    executionCount?: number;
  };
}