import { 
  LeadValidatorNodeConfig, 
  LeadValidatorNodeResponse, 
  LeadValidatorNodeError,
  LeadValidatorNodeResult,
  LeadValidatorNodeConfigSchema,
  ValidationCondition,
  evaluateConditions,
  validateCondition,
  type LeadUpdate
} from './schema';

// Contexto de ejecución para el runner
export interface ExecutionContext {
  variables: Record<string, any>;
  connections?: Record<string, any>;
  stepResults?: Record<string, any>;
  renderTemplate?: (template: string) => string;
}

// Opciones adicionales para el runner
export interface RunnerOptions {
  enableLogs?: boolean;
  databaseManager?: {
    updateLead: (leadId: string, updates: Record<string, any>, collection?: string) => Promise<boolean>;
    getLead: (leadId: string, collection?: string) => Promise<Record<string, any> | null>;
  };
}

/**
 * Runner principal para ejecutar el nodo validador de leads
 * Esta función debe ser pura y no depender de ReactFlow ni del FlowExecutor
 * 
 * @param config - Configuración del nodo (sin validar)
 * @param context - Contexto de ejecución con variables y conexiones
 * @param options - Opciones adicionales para la ejecución
 * @returns Promise con el resultado de la ejecución
 */
export async function executeLeadValidatorNode(
  config: unknown,
  context: ExecutionContext,
  options: RunnerOptions = {}
): Promise<LeadValidatorNodeResult> {
  const startTime = Date.now();
  const { enableLogs = true, databaseManager } = options;

  try {
    // Validar configuración
    const parsedConfig = LeadValidatorNodeConfigSchema.safeParse(config);
    if (!parsedConfig.success) {
      throw new Error(`Configuración inválida: ${parsedConfig.error.message}`);
    }

    const validConfig = parsedConfig.data;

    if (enableLogs && validConfig.logLevel !== 'minimal') {
      console.log(`🔧 LEAD VALIDATOR: Ejecutando ${validConfig.name} en modo ${validConfig.mode}`);
    }

    // Obtener datos del lead del contexto
    const leadData = extractLeadData(context);
    if (!leadData) {
      throw new Error('No se encontraron datos del lead en el contexto');
    }

    if (enableLogs && validConfig.logLevel === 'verbose') {
      console.log('📋 LEAD VALIDATOR: Datos del lead recibidos:', leadData);
    }

    // Procesar según el modo configurado
    let result: LeadValidatorNodeResponse;

    switch (validConfig.mode) {
      case 'validator':
        result = await executeValidatorMode(validConfig, leadData, enableLogs);
        break;
      case 'editor':
        result = await executeEditorMode(validConfig, leadData, databaseManager, enableLogs);
        break;
      case 'router':
        result = await executeRouterMode(validConfig, leadData, databaseManager, enableLogs);
        break;
      default:
        throw new Error(`Modo no soportado: ${validConfig.mode}`);
    }

    // Agregar timing y metadata
    result.executionTime = Date.now() - startTime;
    result.timestamp = new Date().toISOString();

    if (enableLogs && validConfig.logLevel !== 'minimal') {
      console.log(`✅ LEAD VALIDATOR: Completado en ${result.executionTime}ms`);
    }

    return result;

  } catch (error) {
    // Manejar errores
    const errorResult: LeadValidatorNodeError = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido en Validador de Leads',
      details: error instanceof Error ? error.stack : 'No hay detalles disponibles',
      timestamp: new Date().toISOString(),
      leadData: extractLeadData(context),
    };

    if (enableLogs) {
      console.error('❌ LEAD VALIDATOR: Error:', errorResult.error);
    }

    return errorResult;
  }
}

/**
 * Ejecuta el modo validator (validación simple true/false)
 */
async function executeValidatorMode(
  config: LeadValidatorNodeConfig,
  leadData: Record<string, any>,
  enableLogs: boolean
): Promise<LeadValidatorNodeResponse> {
  const validatorConfig = config.validatorConfig;
  if (!validatorConfig) {
    throw new Error('Configuración de validador requerida para modo validator');
  }

  // Evaluar condiciones
  const evaluation = evaluateConditions(leadData, validatorConfig.conditions);
  
  const result: LeadValidatorNodeResponse = {
    success: true,
    mode: 'validator',
    validationResult: {
      isValid: evaluation.result,
      conditionResults: evaluation.details,
      finalMessage: evaluation.result ? validatorConfig.trueMessage : validatorConfig.falseMessage
    },
    leadData: {
      before: leadData,
      after: {
        ...leadData,
        [validatorConfig.outputField]: evaluation.result
      }
    },
    timestamp: new Date().toISOString()
  };

  if (enableLogs && config.logLevel === 'verbose') {
    console.log(`🔍 VALIDATOR: Resultado = ${evaluation.result}`, {
      conditions: validatorConfig.conditions.length,
      passed: evaluation.details.filter(d => d.result).length
    });
  }

  return result;
}

/**
 * Ejecuta el modo editor (modificar datos del lead)
 */
async function executeEditorMode(
  config: LeadValidatorNodeConfig,
  leadData: Record<string, any>,
  databaseManager: RunnerOptions['databaseManager'],
  enableLogs: boolean
): Promise<LeadValidatorNodeResponse> {
  const editorConfig = config.editorConfig;
  if (!editorConfig) {
    throw new Error('Configuración de editor requerida para modo editor');
  }

  let actionsExecuted = 0;
  let updatesApplied = 0;
  let databaseUpdated = false;
  const updatedFields: string[] = [];
  const changes: Record<string, any> = {};
  const afterData = { ...leadData };

  // Ejecutar cada acción condicional
  for (const action of editorConfig.actions) {
    const evaluation = evaluateConditions(leadData, action.conditions);
    
    if (evaluation.result && action.trueActions) {
      // Ejecutar acciones cuando la condición es verdadera
      await applyUpdates(action.trueActions.updates || [], afterData, changes, updatedFields);
      actionsExecuted++;
      updatesApplied += (action.trueActions.updates || []).length;
    } else if (!evaluation.result && action.falseActions) {
      // Ejecutar acciones cuando la condición es falsa
      await applyUpdates(action.falseActions.updates || [], afterData, changes, updatedFields);
      actionsExecuted++;
      updatesApplied += (action.falseActions.updates || []).length;
    }
  }

  // Actualizar base de datos si está configurado
  if (editorConfig.updateDatabase && Object.keys(changes).length > 0 && databaseManager) {
    try {
      const leadId = leadData[editorConfig.identifierField] || leadData.id;
      if (leadId) {
        databaseUpdated = await databaseManager.updateLead(
          leadId, 
          changes, 
          editorConfig.collection
        );
      }
    } catch (error) {
      if (enableLogs) {
        console.warn('⚠️ EDITOR: Error actualizando base de datos:', error);
      }
    }
  }

  const result: LeadValidatorNodeResponse = {
    success: true,
    mode: 'editor',
    editorResult: {
      actionsExecuted,
      updatesApplied,
      databaseUpdated,
      updatedFields,
      changes
    },
    leadData: {
      before: leadData,
      after: afterData
    },
    timestamp: new Date().toISOString()
  };

  if (enableLogs && config.logLevel === 'verbose') {
    console.log(`✏️ EDITOR: Aplicadas ${updatesApplied} actualizaciones`, {
      fields: updatedFields,
      databaseUpdated
    });
  }

  return result;
}

/**
 * Ejecuta el modo router (dirigir flujo a diferentes salidas)
 */
async function executeRouterMode(
  config: LeadValidatorNodeConfig,
  leadData: Record<string, any>,
  databaseManager: RunnerOptions['databaseManager'],
  enableLogs: boolean
): Promise<LeadValidatorNodeResponse> {
  const routerConfig = config.routerConfig;
  if (!routerConfig) {
    throw new Error('Configuración de router requerida para modo router');
  }

  let selectedRoute: string | undefined;
  let routeName: string | undefined;
  let isDefaultRoute = false;
  let appliedUpdates = 0;
  const afterData = { ...leadData };
  const changes: Record<string, any> = {};
  const updatedFields: string[] = [];

  // Evaluar rutas en orden
  for (const route of routerConfig.routes) {
    const evaluation = evaluateConditions(leadData, route.conditions);
    
    if (evaluation.result) {
      selectedRoute = route.output;
      routeName = route.name;
      
      // Aplicar actualizaciones de esta ruta
      if (route.updates && route.updates.length > 0) {
        await applyUpdates(route.updates, afterData, changes, updatedFields);
        appliedUpdates = route.updates.length;
      }
      break;
    }
  }

  // Si ninguna ruta coincidió, usar la ruta por defecto
  if (!selectedRoute && routerConfig.defaultRoute) {
    selectedRoute = routerConfig.defaultRoute;
    routeName = 'Ruta por defecto';
    isDefaultRoute = true;
  }

  const result: LeadValidatorNodeResponse = {
    success: true,
    mode: 'router',
    routerResult: {
      selectedRoute,
      routeName,
      isDefaultRoute,
      appliedUpdates
    },
    leadData: {
      before: leadData,
      after: afterData
    },
    timestamp: new Date().toISOString()
  };

  if (enableLogs && config.logLevel === 'verbose') {
    console.log(`🚦 ROUTER: Ruta seleccionada = ${routeName || 'ninguna'}`, {
      output: selectedRoute,
      isDefault: isDefaultRoute,
      updates: appliedUpdates
    });
  }

  return result;
}

/**
 * Aplica actualizaciones a los datos del lead
 */
async function applyUpdates(
  updates: LeadUpdate[], 
  targetData: Record<string, any>,
  changes: Record<string, any>,
  updatedFields: string[]
): Promise<void> {
  for (const update of updates) {
    const { field, value, valueType } = update;
    
    let finalValue = value;
    
    // Procesar diferentes tipos de valores
    if (valueType === 'dynamic') {
      // Buscar valor desde los datos existentes
      finalValue = getNestedValue(targetData, String(value));
    } else if (valueType === 'computed') {
      // TODO: Implementar expresiones computadas
      finalValue = value;
    }
    
    // Aplicar la actualización
    setNestedValue(targetData, field, finalValue);
    changes[field] = finalValue;
    
    if (!updatedFields.includes(field)) {
      updatedFields.push(field);
    }
  }
}

/**
 * Extrae datos del lead del contexto de ejecución
 */
function extractLeadData(context: ExecutionContext): Record<string, any> | null {
  // Buscar en diferentes ubicaciones posibles
  if (context.variables?.leadData) {
    return context.variables.leadData;
  }
  
  if (context.variables?.inputData?.leadData) {
    return context.variables.inputData.leadData;
  }
  
  if (context.variables?.trigger?.input) {
    return context.variables.trigger.input;
  }
  
  // Si no hay estructura específica, asumir que todo el contexto son datos del lead
  if (context.variables && Object.keys(context.variables).length > 0) {
    return context.variables;
  }
  
  return null;
}

/**
 * Obtiene un valor anidado de un objeto usando notación de punto
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Establece un valor anidado en un objeto usando notación de punto
 */
function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Procesa templates en la configuración usando el contexto
 * TODO: Implementar según necesidades específicas del nodo
 */
function processTemplates(config: LeadValidatorNodeConfig, context: ExecutionContext): LeadValidatorNodeConfig {
  // Ejemplo básico de procesamiento de templates
  if (context.renderTemplate && typeof config.name === 'string') {
    return {
      ...config,
      name: context.renderTemplate(config.name),
    };
  }
  return config;
}

/**
 * Utility para esperar un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Valida y sanitiza una configuración del nodo base
 */
export function validateLeadValidatorNodeConfig(config: unknown): LeadValidatorNodeConfig {
  const result = LeadValidatorNodeConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Configuración inválida: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Crea una configuración por defecto para el nodo base
 */
export function createDefaultLeadValidatorNodeConfig(overrides: Partial<LeadValidatorNodeConfig> = {}): LeadValidatorNodeConfig {
  return LeadValidatorNodeConfigSchema.parse({
    name: 'Validador de Leads',
    // TODO: Agregar defaults específicos aquí
    ...overrides,
  });
}

// TODO: Agregar funciones helper específicas del nodo aquí
// Ejemplos:
// - Validaciones custom
// - Formateo de datos
// - Comunicación con APIs externas
// - Transformaciones específicas