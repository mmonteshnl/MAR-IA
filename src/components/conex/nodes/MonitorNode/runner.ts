import { 
  MonitorNodeConfig, 
  MonitorNodeResponse, 
  MonitorNodeError,
  MonitorNodeResult,
  MonitorNodeConfigSchema 
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
 * Runner para ejecutar el Monitor Node
 * Captura y muestra datos del flujo para debugging
 * 
 * @param config - Configuración del nodo (sin validar)
 * @param context - Contexto de ejecución con variables y datos
 * @param options - Opciones adicionales para la ejecución
 * @returns Promise con el resultado de la ejecución
 */
export async function executeMonitorNode(
  config: unknown,
  context: ExecutionContext,
  options: RunnerOptions = {}
): Promise<MonitorNodeResult> {
  const { enableLogs = true } = options;

  try {
    // Validar configuración
    const parsedConfig = MonitorNodeConfigSchema.safeParse(config);
    if (!parsedConfig.success) {
      throw new Error(`Configuración inválida: ${parsedConfig.error.message}`);
    }

    const validConfig = parsedConfig.data;
    const {
      name = 'Debug Monitor',
      displayFields = '',
      outputFormat = 'json',
      enableTimestamp = true
    } = validConfig;

    // Get all available data
    const allData = {
      trigger: context.variables.trigger || {},
      stepResults: context.stepResults || {},
      currentVariables: context.variables || {}
    };

    // Filter fields if specified
    let dataToShow = allData;
    if (displayFields && displayFields.trim()) {
      const fields = displayFields.split(',').map(f => f.trim());
      dataToShow = {};
      
      for (const field of fields) {
        // Support nested field access like "step_api-call-1.response"
        const value = getNestedValue(allData, field);
        if (value !== undefined) {
          dataToShow[field] = value;
        }
      }
    }

    // Format output
    let formattedOutput: string;
    switch (outputFormat) {
      case 'table':
        formattedOutput = formatAsTable(dataToShow);
        break;
      case 'list':
        formattedOutput = formatAsList(dataToShow);
        break;
      case 'json':
      default:
        formattedOutput = JSON.stringify(dataToShow, null, 2);
        break;
    }

    // Create monitor result
    const timestamp = enableTimestamp ? new Date().toISOString() : undefined;
    
    const monitorResult: MonitorNodeResponse = {
      success: true,
      monitorName: name,
      timestamp,
      dataSnapshot: dataToShow,
      formattedOutput,
      // This will be logged to console in the frontend
      consoleLog: {
        title: `🔍 MONITOR: ${name}`,
        data: dataToShow,
        format: outputFormat,
        timestamp,
      }
    };

    // Log to console directly (for backend execution)
    if (enableLogs) {
      console.log(`🔍 MONITOR: ${name}`);
      if (enableTimestamp) console.log(`⏰ Timestamp: ${timestamp}`);
      console.log('📦 Datos capturados:', dataToShow);
    }

    return monitorResult;

  } catch (error) {
    // Manejar errores
    const errorResult: MonitorNodeError = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido en Monitor Node',
      details: error instanceof Error ? error.stack : 'No hay detalles disponibles',
      timestamp: new Date().toISOString(),
    };

    if (enableLogs) {
      console.error('❌ MONITOR NODE: Error:', errorResult.error);
    }

    return errorResult;
  }
}

/**
 * Procesa templates en la configuración usando el contexto
 * TODO: Implementar según necesidades específicas del nodo
 */
function processTemplates(config: MonitorNodeConfig, context: ExecutionContext): MonitorNodeConfig {
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
 * Helper para obtener valores anidados de objetos usando dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Formatea datos como una tabla simple
 */
function formatAsTable(data: any): string {
  const entries = Object.entries(data);
  if (entries.length === 0) return 'No data';
  
  let table = 'Field\t\t\tValue\n';
  table += '='.repeat(50) + '\n';
  
  for (const [key, value] of entries) {
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
    table += `${key.padEnd(20)}\t${valueStr.substring(0, 50)}\n`;
  }
  
  return table;
}

/**
 * Formatea datos como una lista simple
 */
function formatAsList(data: any): string {
  const entries = Object.entries(data);
  if (entries.length === 0) return 'No data';
  
  return entries.map(([key, value]) => {
    const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    return `• ${key}: ${valueStr}`;
  }).join('\n');
}

/**
 * Valida y sanitiza una configuración del nodo base
 */
export function validateMonitorNodeConfig(config: unknown): MonitorNodeConfig {
  const result = MonitorNodeConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Configuración inválida: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Crea una configuración por defecto para el nodo base
 */
export function createDefaultMonitorNodeConfig(overrides: Partial<MonitorNodeConfig> = {}): MonitorNodeConfig {
  return MonitorNodeConfigSchema.parse({
    name: 'Monitor de Debug',
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