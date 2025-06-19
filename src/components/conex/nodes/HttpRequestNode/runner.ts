import Handlebars from 'handlebars';
import { 
  HttpRequestConfig, 
  HttpRequestResponse, 
  HttpRequestError,
  HttpRequestResult,
  HttpRequestConfigSchema 
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
  maxRetries?: number;
  baseTimeout?: number;
}

/**
 * Runner puro para ejecutar peticiones HTTP
 * Esta función no depende de ReactFlow ni del FlowExecutor
 */
export async function executeHttpRequest(
  config: unknown,
  context: ExecutionContext,
  options: RunnerOptions = {}
): Promise<HttpRequestResult> {
  const startTime = Date.now();
  const { enableLogs = true, maxRetries = 10, baseTimeout = 300 } = options;

  try {
    // Validar configuración
    const parsedConfig = HttpRequestConfigSchema.safeParse(config);
    if (!parsedConfig.success) {
      throw new Error(`Configuración inválida: ${parsedConfig.error.message}`);
    }

    const validConfig = parsedConfig.data;
    const {
      method = 'GET',
      url,
      headers = {},
      body,
      timeout = 30,
      retries = 1,
      followRedirects = true,
    } = validConfig;

    if (enableLogs) {
      console.log(`🌐 HTTP REQUEST: ${method.toUpperCase()} ${url}`);
      console.log(`⏱️ Timeout: ${timeout}s, Reintentos: ${retries}`);
    }

    // Renderizar templates en URL, headers y body
    const renderedUrl = renderTemplate(url, context);
    const renderedHeaders = renderObjectTemplates(headers, context);
    const renderedBody = body ? renderObjectTemplates(body, context) : undefined;

    // Configurar opciones de fetch
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'User-Agent': 'CMR-FlowBuilder/1.0',
        ...renderedHeaders,
      },
      redirect: followRedirects ? 'follow' : 'manual',
      signal: AbortSignal.timeout(Math.min(timeout, baseTimeout) * 1000),
    };

    // Agregar body si es necesario
    if (renderedBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      if (typeof renderedBody === 'object') {
        fetchOptions.body = JSON.stringify(renderedBody);
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Content-Type': 'application/json',
        };
      } else {
        fetchOptions.body = String(renderedBody);
      }
    }

    // Lógica de reintentos con backoff exponencial
    let lastError: Error | null = null;
    const maxAttempts = Math.min(retries + 1, maxRetries);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1 && enableLogs) {
          console.log(`🔄 HTTP REQUEST: Intento ${attempt}/${maxAttempts}`);
        }

        const response = await fetch(renderedUrl, fetchOptions);
        const duration = Date.now() - startTime;

        if (enableLogs) {
          console.log(`🌐 HTTP RESPONSE: ${response.status} ${response.statusText} (${duration}ms)`);
        }

        // Manejar errores HTTP
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          
          // Crear error estructurado
          const errorResult: HttpRequestError = {
            error: true,
            status: response.status,
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: errorText,
            url: renderedUrl,
            method: method.toUpperCase(),
            timestamp: new Date().toISOString(),
            attempt,
          };

          // Para errores 4xx, no reintentar (errores del cliente)
          if (response.status >= 400 && response.status < 500) {
            return errorResult;
          }

          // Para errores 5xx, reintentar si quedan intentos
          if (response.status >= 500 && attempt < maxAttempts) {
            lastError = new Error(errorResult.message);
            await sleep(calculateBackoff(attempt));
            continue;
          }

          return errorResult;
        }

        // Procesar respuesta exitosa
        const responseData = await processResponse(response);
        const finalDuration = Date.now() - startTime;

        if (enableLogs) {
          console.log(`🌐 HTTP SUCCESS: Datos recibidos (${finalDuration}ms)`);
        }

        // Crear respuesta estructurada
        const successResult: HttpRequestResponse = {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url: renderedUrl,
          method: method.toUpperCase(),
          timestamp: new Date().toISOString(),
          attempt,
          duration: finalDuration,
        };

        return successResult;

      } catch (error) {
        lastError = error as Error;

        // Si es timeout, crear error específico
        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutError: HttpRequestError = {
            error: true,
            message: `Timeout después de ${timeout}s`,
            details: `La petición fue cancelada por timeout`,
            url: renderedUrl,
            method: method.toUpperCase(),
            timestamp: new Date().toISOString(),
            attempt,
          };
          
          if (attempt < maxAttempts) {
            await sleep(calculateBackoff(attempt));
            continue;
          }
          
          return timeoutError;
        }

        // Para otros errores de red, reintentar si quedan intentos
        if (attempt < maxAttempts) {
          if (enableLogs) {
            console.log(`⚠️ HTTP REQUEST: Error en intento ${attempt}, reintentando...`);
          }
          await sleep(calculateBackoff(attempt));
          continue;
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    const failureError: HttpRequestError = {
      error: true,
      message: lastError?.message || 'Falló después de todos los reintentos',
      details: lastError?.stack || 'Error desconocido',
      url: renderedUrl,
      method: method.toUpperCase(),
      timestamp: new Date().toISOString(),
      attempt: maxAttempts,
    };

    return failureError;

  } catch (error) {
    // Error en la configuración o inicialización
    const criticalError: HttpRequestError = {
      error: true,
      message: error instanceof Error ? error.message : 'Error crítico en HTTP Request',
      details: error instanceof Error ? error.stack : 'Error desconocido',
      url: 'unknown',
      method: 'unknown',
      timestamp: new Date().toISOString(),
      attempt: 1,
    };

    return criticalError;
  }
}

/**
 * Renderiza un template usando Handlebars con el contexto proporcionado
 */
function renderTemplate(template: string, context: ExecutionContext): string {
  try {
    // Si hay una función de renderizado personalizada, usarla
    if (context.renderTemplate) {
      return context.renderTemplate(template);
    }

    // Usar Handlebars por defecto
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(context.variables || {});
  } catch (error) {
    console.warn(`Template rendering failed for: ${template}`, error);
    return template; // Devolver template original si falla
  }
}

/**
 * Renderiza templates en todas las propiedades de un objeto
 */
function renderObjectTemplates(obj: Record<string, any>, context: ExecutionContext): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = renderTemplate(value, context);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = renderObjectTemplates(value, context);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Procesa la respuesta HTTP según el Content-Type
 */
async function processResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await response.json();
  } else if (contentType.includes('text/')) {
    return { text: await response.text() };
  } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
    return { xml: await response.text() };
  } else {
    // Para contenido binario o desconocido
    const arrayBuffer = await response.arrayBuffer();
    return { 
      binary: true, 
      size: arrayBuffer.byteLength,
      contentType: contentType || 'application/octet-stream'
    };
  }
}

/**
 * Calcula el tiempo de espera con backoff exponencial
 */
function calculateBackoff(attempt: number): number {
  // Backoff exponencial: 1s, 2s, 4s, 8s, etc. (max 30s)
  return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
}

/**
 * Utility para esperar un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Valida y sanitiza una configuración de HTTP Request
 */
export function validateHttpRequestConfig(config: unknown): HttpRequestConfig {
  const result = HttpRequestConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Configuración inválida: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Crea una configuración por defecto para HTTP Request
 */
export function createDefaultHttpRequestConfig(overrides: Partial<HttpRequestConfig> = {}): HttpRequestConfig {
  return HttpRequestConfigSchema.parse({
    name: 'HTTP Request',
    method: 'GET',
    url: 'https://api.ejemplo.com/endpoint',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 30,
    retries: 1,
    ...overrides,
  });
}