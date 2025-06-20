import { z } from 'zod';

// Operadores de comparación disponibles
export const ComparisonOperators = [
  '==', '!=', '>', '<', '>=', '<=', 
  'contains', 'startsWith', 'endsWith', 
  'isEmpty', 'isNotEmpty', 'length>', 'length<', 'length=='
] as const;

// Alias for backwards compatibility
export const COMPARISON_OPERATORS = ComparisonOperators;

export type ComparisonOperator = typeof ComparisonOperators[number];

// Operadores lógicos para combinar condiciones
export const LogicalOperators = ['AND', 'OR'] as const;
// Alias for backwards compatibility
export const LOGIC_OPERATORS = LogicalOperators;

export type LogicalOperator = typeof LogicalOperators[number];

// Schema para una condición individual
export const ValidationConditionSchema = z.object({
  id: z.string().optional(), // Para identificar la condición en la UI
  field: z.string().min(1, 'El campo es requerido'), // Campo del lead a validar (ej: "context", "leadValue")
  operator: z.enum(ComparisonOperators, {
    errorMap: () => ({ message: 'Operador no válido' })
  }),
  value: z.union([z.string(), z.number(), z.boolean()], {
    errorMap: () => ({ message: 'Valor debe ser texto, número o booleano' })
  }),
  logicOperator: z.enum(LogicalOperators).optional(), // AND/OR para conectar con la siguiente condición
});

export type ValidationCondition = z.infer<typeof ValidationConditionSchema>;

// Schema para actualizaciones del lead
export const LeadUpdateSchema = z.object({
  field: z.string().min(1, 'El campo es requerido'),
  value: z.union([z.string(), z.number(), z.boolean()]),
  valueType: z.enum(['static', 'dynamic', 'computed']).optional().default('static'),
});

export type LeadUpdate = z.infer<typeof LeadUpdateSchema>;

// Schema para acciones condicionales
export const ConditionalActionSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional().default('Acción sin nombre'),
  conditions: z.array(ValidationConditionSchema).min(1, 'Se requiere al menos una condición'),
  trueActions: z.object({
    updates: z.array(LeadUpdateSchema).optional().default([]),
    output: z.string().optional(), // Para conectar a otros nodos
    message: z.string().optional(),
  }).optional(),
  falseActions: z.object({
    updates: z.array(LeadUpdateSchema).optional().default([]),
    output: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
});

export type ConditionalAction = z.infer<typeof ConditionalActionSchema>;

// Schema principal de configuración del nodo
export const LeadValidatorNodeConfigSchema = z.object({
  name: z.string().optional().default('Validador de Leads'),
  
  // Modo de operación del nodo
  mode: z.enum(['validator', 'editor', 'router']).default('validator'),
  
  // Configuración para modo validator (solo true/false)
  validatorConfig: z.object({
    conditions: z.array(ValidationConditionSchema).min(1, 'Se requiere al menos una condición'),
    outputField: z.string().optional().default('isValid'), // Campo donde se guarda el resultado
    trueMessage: z.string().optional().default('Validación exitosa'),
    falseMessage: z.string().optional().default('Validación fallida'),
  }).optional(),
  
  // Configuración para modo editor (modificar datos del lead)
  editorConfig: z.object({
    actions: z.array(ConditionalActionSchema).min(1, 'Se requiere al menos una acción'),
    updateDatabase: z.boolean().default(false), // Si actualiza la base de datos real
    collection: z.string().optional().default('leads'),
    identifierField: z.string().optional().default('id'),
  }).optional(),
  
  // Configuración para modo router (dirigir flujo)
  routerConfig: z.object({
    routes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      conditions: z.array(ValidationConditionSchema),
      output: z.string(), // Nombre del output para conectar
      updates: z.array(LeadUpdateSchema).optional().default([]),
    })).min(1, 'Se requiere al menos una ruta'),
    defaultRoute: z.string().optional(), // Ruta por defecto si ninguna condición se cumple
  }).optional(),
  
  // Configuración general
  enableLogging: z.boolean().default(true),
  logLevel: z.enum(['minimal', 'detailed', 'verbose']).default('detailed'),
  continueOnError: z.boolean().default(true),
});

export type LeadValidatorNodeConfig = z.infer<typeof LeadValidatorNodeConfigSchema>;

// Schema para respuesta del nodo
export const LeadValidatorNodeResponseSchema = z.object({
  success: z.boolean(),
  mode: z.enum(['validator', 'editor', 'router']),
  
  // Resultados por modo
  validationResult: z.object({
    isValid: z.boolean(),
    conditionResults: z.array(z.object({
      condition: ValidationConditionSchema,
      result: z.boolean(),
      actualValue: z.any(),
      message: z.string().optional(),
    })),
    finalMessage: z.string(),
  }).optional(),
  
  editorResult: z.object({
    actionsExecuted: z.number(),
    updatesApplied: z.number(),
    databaseUpdated: z.boolean(),
    updatedFields: z.array(z.string()),
    changes: z.record(z.any()), // Los cambios aplicados
  }).optional(),
  
  routerResult: z.object({
    selectedRoute: z.string().optional(),
    routeName: z.string().optional(),
    isDefaultRoute: z.boolean(),
    appliedUpdates: z.number(),
  }).optional(),
  
  // Datos del lead (antes y después)
  leadData: z.object({
    before: z.record(z.any()),
    after: z.record(z.any()),
  }).optional(),
  
  // Metadata
  timestamp: z.string(),
  executionTime: z.number().optional(),
  warnings: z.array(z.string()).optional(),
  debug: z.record(z.any()).optional(),
});

export type LeadValidatorNodeResponse = z.infer<typeof LeadValidatorNodeResponseSchema>;

// Schema para errores del nodo
export const LeadValidatorNodeErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.string().optional(),
  timestamp: z.string(),
  field: z.string().optional(), // Campo que causó el error
  condition: ValidationConditionSchema.optional(), // Condición que falló
  leadData: z.record(z.any()).optional(),
});

export type LeadValidatorNodeError = z.infer<typeof LeadValidatorNodeErrorSchema>;

// Union type para respuesta completa
export type LeadValidatorNodeResult = LeadValidatorNodeResponse | LeadValidatorNodeError;

// Metadata del nodo
export interface LeadValidatorNodeData {
  config: LeadValidatorNodeConfig;
  meta?: {
    status?: 'idle' | 'loading' | 'success' | 'error';
    lastExecution?: string;
    executionCount?: number;
    lastValidationResult?: boolean;
    averageExecutionTime?: number;
    totalLeadsProcessed?: number;
  };
}

// Funciones helper para validación
export function validateCondition(
  leadData: Record<string, any>, 
  condition: ValidationCondition
): { result: boolean; actualValue: any; message?: string } {
  const { field, operator, value } = condition;
  const actualValue = getNestedValue(leadData, field);
  
  let result = false;
  let message: string | undefined;
  
  try {
    switch (operator) {
      case '==':
        result = actualValue == value;
        break;
      case '!=':
        result = actualValue != value;
        break;
      case '>':
        result = Number(actualValue) > Number(value);
        break;
      case '<':
        result = Number(actualValue) < Number(value);
        break;
      case '>=':
        result = Number(actualValue) >= Number(value);
        break;
      case '<=':
        result = Number(actualValue) <= Number(value);
        break;
      case 'contains':
        result = String(actualValue).includes(String(value));
        break;
      case 'startsWith':
        result = String(actualValue).startsWith(String(value));
        break;
      case 'endsWith':
        result = String(actualValue).endsWith(String(value));
        break;
      case 'isEmpty':
        result = !actualValue || actualValue === '' || actualValue === null || actualValue === undefined;
        break;
      case 'isNotEmpty':
        result = !!actualValue && actualValue !== '' && actualValue !== null && actualValue !== undefined;
        break;
      case 'length>':
        result = String(actualValue).length > Number(value);
        break;
      case 'length<':
        result = String(actualValue).length < Number(value);
        break;
      case 'length==':
        result = String(actualValue).length === Number(value);
        break;
      default:
        throw new Error(`Operador no soportado: ${operator}`);
    }
  } catch (error) {
    message = `Error en validación: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    result = false;
  }
  
  return { result, actualValue, message };
}

// Helper para obtener valores anidados (ej: "user.profile.name")
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper para evaluar múltiples condiciones con operadores lógicos
export function evaluateConditions(
  leadData: Record<string, any>, 
  conditions: ValidationCondition[]
): { result: boolean; details: Array<{ condition: ValidationCondition; result: boolean; actualValue: any; message?: string }> } {
  if (conditions.length === 0) {
    return { result: true, details: [] };
  }
  
  const details = conditions.map(condition => ({
    condition,
    ...validateCondition(leadData, condition)
  }));
  
  // Evaluar con operadores lógicos
  let finalResult = details[0].result;
  
  for (let i = 1; i < conditions.length; i++) {
    const prevCondition = conditions[i - 1];
    const currentResult = details[i].result;
    
    if (prevCondition.logicOperator === 'OR') {
      finalResult = finalResult || currentResult;
    } else { // Default AND
      finalResult = finalResult && currentResult;
    }
  }
  
  return { result: finalResult, details };
}