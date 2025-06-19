import { 
  BaseNodeConfig, 
  BaseNodeResponse, 
  BaseNodeError,
  BaseNodeResult,
  BaseNodeConfigSchema 
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
  // TODO: Agregar opciones específicas del nodo aquí
}

/**
 * Runner principal para ejecutar el nodo base
 * Esta función debe ser pura y no depender de ReactFlow ni del FlowExecutor
 * 
 * @param config - Configuración del nodo (sin validar)
 * @param context - Contexto de ejecución con variables y conexiones
 * @param options - Opciones adicionales para la ejecución
 * @returns Promise con el resultado de la ejecución
 */
export async function executeBaseNode(
  config: unknown,
  context: ExecutionContext,
  options: RunnerOptions = {}
): Promise<BaseNodeResult> {
  const startTime = Date.now();
  const { enableLogs = true } = options;

  try {
    // Validar configuración
    const parsedConfig = BaseNodeConfigSchema.safeParse(config);
    if (!parsedConfig.success) {
      throw new Error(`Configuración inválida: ${parsedConfig.error.message}`);
    }

    const validConfig = parsedConfig.data;

    if (enableLogs) {
      console.log(`🔧 BASE NODE: Ejecutando ${validConfig.name}`);
    }

    // TODO: Implementar lógica específica del nodo aquí
    // Ejemplo:
    // 1. Procesar templates en la configuración
    // 2. Realizar operación principal (API call, transformación, etc.)
    // 3. Manejar errores específicos
    // 4. Formatear respuesta

    // Ejemplo de procesamiento de templates
    // const processedConfig = processTemplates(validConfig, context);

    // Simular trabajo del nodo
    await sleep(100); // TODO: Reemplazar con lógica real

    // Crear respuesta exitosa
    const successResult: BaseNodeResponse = {
      success: true,
      data: {
        // TODO: Agregar datos de respuesta reales aquí
        processed: true,
        config: validConfig,
        executedAt: new Date().toISOString(),
      },
      message: `Nodo ${validConfig.name} ejecutado exitosamente`,
      timestamp: new Date().toISOString(),
    };

    if (enableLogs) {
      const duration = Date.now() - startTime;
      console.log(`✅ BASE NODE: Completado en ${duration}ms`);
    }

    return successResult;

  } catch (error) {
    // Manejar errores
    const errorResult: BaseNodeError = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido en Base Node',
      details: error instanceof Error ? error.stack : 'No hay detalles disponibles',
      timestamp: new Date().toISOString(),
    };

    if (enableLogs) {
      console.error('❌ BASE NODE: Error:', errorResult.error);
    }

    return errorResult;
  }
}

/**
 * Procesa templates en la configuración usando el contexto
 * TODO: Implementar según necesidades específicas del nodo
 */
function processTemplates(config: BaseNodeConfig, context: ExecutionContext): BaseNodeConfig {
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
export function validateBaseNodeConfig(config: unknown): BaseNodeConfig {
  const result = BaseNodeConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Configuración inválida: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Crea una configuración por defecto para el nodo base
 */
export function createDefaultBaseNodeConfig(overrides: Partial<BaseNodeConfig> = {}): BaseNodeConfig {
  return BaseNodeConfigSchema.parse({
    name: 'Base Node',
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