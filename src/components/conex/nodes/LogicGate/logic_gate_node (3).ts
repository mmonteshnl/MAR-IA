// LogicGateNode/schema.ts
import { z } from 'zod';

export const LogicGateNodeConfigSchema = z.object({
  name: z.string().default('Compuerta Lógica').describe('Nombre del nodo'),
  gateType: z.enum(['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR']).default('AND').describe('Tipo de compuerta lógica'),
});

export const LogicGateNodeDataSchema = z.object({
  config: LogicGateNodeConfigSchema,
  meta: z.object({
    status: z.enum(['idle', 'loading', 'success', 'error']).optional(),
    lastExecution: z.string().optional(),
    executionCount: z.number().optional(),
    lastResult: z.any().optional(),
    lastError: z.string().optional(),
  }).optional(),
});

export type LogicGateNodeConfig = z.infer<typeof LogicGateNodeConfigSchema>;
export type LogicGateNodeData = z.infer<typeof LogicGateNodeDataSchema>;
