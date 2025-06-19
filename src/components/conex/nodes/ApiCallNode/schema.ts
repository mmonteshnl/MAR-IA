import { z } from 'zod';

export const ApiCallNodeConfigSchema = z.object({
  name: z.string().default('Llamada API'),
  url: z.string().url().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  timeout: z.number().min(1000).max(30000).default(10000),
  retries: z.number().min(0).max(5).default(0),
  authentication: z.object({
    type: z.enum(['none', 'bearer', 'basic', 'api-key']).default('none'),
    token: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    apiKey: z.string().optional(),
    apiKeyHeader: z.string().optional(),
  }).optional(),
});

export const ApiCallNodeDataSchema = z.object({
  config: ApiCallNodeConfigSchema,
  meta: z.object({
    status: z.enum(['idle', 'loading', 'success', 'error']).optional(),
    lastExecution: z.string().optional(),
    executionCount: z.number().optional(),
    lastResponse: z.any().optional(),
    lastError: z.string().optional(),
  }).optional(),
});

export type ApiCallNodeConfig = z.infer<typeof ApiCallNodeConfigSchema>;
export type ApiCallNodeData = z.infer<typeof ApiCallNodeDataSchema>;