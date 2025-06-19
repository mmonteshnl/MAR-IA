import { 
  TriggerNodeConfig, 
  TriggerNodeResponse, 
  TriggerNodeError,
  TriggerNodeResult,
  TriggerNodeConfigSchema 
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
  executionId?: string;
}

/**
 * Runner para ejecutar el Trigger Node
 * El Trigger Node simplemente devuelve los datos de entrada del contexto
 * 
 * @param config - Configuración del nodo (sin validar)
 * @param context - Contexto de ejecución con variables y datos
 * @param options - Opciones adicionales para la ejecución
 * @returns Promise con el resultado de la ejecución
 */
export async function executeTriggerNode(
  config: unknown,
  context: ExecutionContext,
  options: RunnerOptions = {}
): Promise<TriggerNodeResult> {
  const { enableLogs = true, executionId } = options;

  try {
    // Validar configuración
    const parsedConfig = TriggerNodeConfigSchema.safeParse(config);
    if (!parsedConfig.success) {
      throw new Error(`Configuración inválida: ${parsedConfig.error.message}`);
    }

    const validConfig = parsedConfig.data;
    
    // El trigger node simplemente devuelve los datos de entrada
    const triggerData = context.variables.trigger?.input || {};
    
    if (enableLogs) {
      console.log(`🚀 TRIGGER: ${validConfig.name}`);
      console.log('📦 Datos recibidos:', Object.keys(triggerData).length, 'campos');
    }

    const response: TriggerNodeResponse = {
      success: true,
      triggerData,
      leadData: triggerData, // Los datos del trigger suelen ser datos de lead
      timestamp: new Date().toISOString(),
      executionId,
    };

    if (enableLogs) {
      console.log(`✅ TRIGGER: Datos proporcionados al flujo`);
    }

    return response;

  } catch (error) {
    // Manejar errores
    const errorResult: TriggerNodeError = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido en Trigger Node',
      details: error instanceof Error ? error.stack : 'No hay detalles disponibles',
      timestamp: new Date().toISOString(),
    };

    if (enableLogs) {
      console.error('❌ TRIGGER: Error:', errorResult.error);
    }

    return errorResult;
  }
}

/**
 * Valida y sanitiza una configuración del nodo Trigger
 */
export function validateTriggerNodeConfig(config: unknown): TriggerNodeConfig {
  const result = TriggerNodeConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Configuración inválida: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Crea una configuración por defecto para el nodo Trigger
 */
export function createDefaultTriggerNodeConfig(overrides: Partial<TriggerNodeConfig> = {}): TriggerNodeConfig {
  return TriggerNodeConfigSchema.parse({
    name: 'Disparador',
    description: 'Punto de inicio del flujo',
    ...overrides,
  });
}