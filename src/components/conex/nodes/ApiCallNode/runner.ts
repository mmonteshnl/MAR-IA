import { ApiCallNodeConfig } from './schema';

export interface ApiCallNodeContext {
  input: any;
  variables: Record<string, any>;
}

export interface ApiCallNodeResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  headers?: Record<string, string>;
}

export async function runApiCallNode(
  config: ApiCallNodeConfig,
  context: ApiCallNodeContext
): Promise<ApiCallNodeResult> {
  try {
    if (!config.url) {
      throw new Error('URL is required for API call');
    }

    // Replace variables in URL and body
    const processedUrl = replaceVariables(config.url, context);
    const processedBody = config.body ? replaceVariables(config.body, context) : undefined;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Add authentication headers
    if (config.authentication) {
      switch (config.authentication.type) {
        case 'bearer':
          if (config.authentication.token) {
            headers['Authorization'] = `Bearer ${config.authentication.token}`;
          }
          break;
        case 'basic':
          if (config.authentication.username && config.authentication.password) {
            const credentials = btoa(`${config.authentication.username}:${config.authentication.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'api-key':
          if (config.authentication.apiKey && config.authentication.apiKeyHeader) {
            headers[config.authentication.apiKeyHeader] = config.authentication.apiKey;
          }
          break;
      }
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: config.method,
      headers,
      signal: AbortSignal.timeout(config.timeout),
    };

    if (processedBody && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      fetchOptions.body = processedBody;
    }

    // Execute request with retries
    let lastError: Error;
    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        const response = await fetch(processedUrl, fetchOptions);
        
        // Parse response
        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // Convert headers to object
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        if (!response.ok) {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
            data: responseData,
            headers: responseHeaders,
          };
        }

        return {
          success: true,
          data: responseData,
          status: response.status,
          headers: responseHeaders,
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < config.retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    return {
      success: false,
      error: lastError!.message,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

function replaceVariables(text: string, context: ApiCallNodeContext): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = context;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return match; // Return original if path not found
      }
    }
    
    return String(value);
  });
}