# HttpRequestNode

Nodo para realizar peticiones HTTP avanzadas con soporte completo para REST APIs, autenticación, reintentos y manejo de errores.

## Características

- ✅ **Métodos HTTP completos**: GET, POST, PUT, DELETE, PATCH
- ✅ **Headers personalizados**: Soporte completo para autenticación y headers custom
- ✅ **Reintentos inteligentes**: Backoff exponencial para APIs inestables
- ✅ **Timeouts configurables**: Control preciso del tiempo de espera (1-300s)
- ✅ **Templates dinámicos**: Variables Handlebars en URL, headers y body
- ✅ **Manejo de errores**: Respuestas estructuradas para éxito y error
- ✅ **Validación de tipos**: Schema Zod para configuración segura
- ✅ **SSL/TLS configurable**: Opción de validar o saltar certificados
- ✅ **Seguimiento de redirecciones**: Control de redirecciones 30x

## Estructura de Archivos

```
HttpRequestNode/
├── index.ts                    # Exportaciones principales
├── HttpRequestNode.tsx         # Componente UI para ReactFlow
├── HttpRequestSettings.tsx     # Panel de configuración avanzado
├── runner.ts                   # Lógica de ejecución pura
├── schema.ts                   # Tipos TypeScript y validación Zod
├── constants.ts                # Configuraciones por defecto y metadatos
└── README.md                   # Documentación (este archivo)
```

## Configuración

### Configuración Básica
```typescript
{
  name: 'Mi API Call',
  method: 'GET',
  url: 'https://api.ejemplo.com/users',
  timeout: 30,
  retries: 2
}
```

### Configuración con Autenticación
```typescript
{
  name: 'API con Bearer Token',
  method: 'POST',
  url: 'https://api.ejemplo.com/leads',
  headers: {
    'Authorization': 'Bearer {{connections.api.token}}',
    'Content-Type': 'application/json'
  },
  body: {
    name: '{{trigger.input.leadName}}',
    email: '{{trigger.input.leadEmail}}'
  },
  timeout: 45,
  retries: 3
}
```

### Configuración de Webhook
```typescript
{
  name: 'Slack Webhook',
  method: 'POST',
  url: 'https://hooks.slack.com/services/{{config.webhookPath}}',
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    text: 'Nuevo lead: {{trigger.input.leadName}}',
    channel: '#leads'
  },
  timeout: 15,
  retries: 1
}
```

## Variables Disponibles

### En URL y Headers
- `{{trigger.input.campo}}` - Datos del disparador
- `{{step_nodeId.response}}` - Resultado de nodos anteriores
- `{{connections.api.token}}` - Credenciales de conexiones
- `{{config.customVar}}` - Variables de configuración

### En Body (JSON)
```json
{
  "leadData": {
    "name": "{{trigger.input.leadName}}",
    "email": "{{trigger.input.leadEmail}}",
    "source": "CRM"
  },
  "metadata": {
    "timestamp": "{{now}}",
    "processedBy": "{{config.processorId}}"
  }
}
```

## Respuesta del Nodo

### Respuesta Exitosa
```typescript
{
  data: any,                    // Datos de respuesta procesados
  status: number,               // Código HTTP (200, 201, etc.)
  statusText: string,           // Texto del estado HTTP
  headers: Record<string, string>, // Headers de respuesta
  url: string,                  // URL final (después de redirecciones)
  method: string,               // Método HTTP usado
  timestamp: string,            // ISO timestamp de la petición
  attempt: number,              // Número de intento exitoso
  duration: number              // Duración en millisegundos
}
```

### Respuesta de Error
```typescript
{
  error: true,
  status?: number,              // Código HTTP si está disponible
  message: string,              // Mensaje de error legible
  details?: string,             // Detalles técnicos adicionales
  url: string,                  // URL que falló
  method: string,               // Método HTTP usado
  timestamp: string,            // ISO timestamp del error
  attempt: number               // Número de intento que falló
}
```

## Manejo de Errores

### Errores 4xx (Cliente)
- **No se reintentan** automáticamente
- Se retorna inmediatamente como error
- Útil para errores de autenticación, permisos, etc.

### Errores 5xx (Servidor)
- **Se reintentan** según configuración
- Backoff exponencial: 1s, 2s, 4s, 8s, etc.
- Máximo 30s de espera entre reintentos

### Timeouts
- Se reintentan según configuración
- Signal AbortController para cancelación limpia
- Configurables de 1-300 segundos

## Uso en FlowExecutor

```typescript
import { executeHttpRequest } from './runner';

// En el FlowExecutor
const result = await executeHttpRequest(
  node.data.config,
  {
    variables: this.context.variables,
    connections: this.context.connections,
    stepResults: this.context.stepResults
  },
  {
    enableLogs: true,
    maxRetries: 10,
    baseTimeout: 300
  }
);
```

## Testing

### Unit Tests (runner.ts)
```typescript
import { executeHttpRequest } from './runner';

test('should execute GET request successfully', async () => {
  const config = {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    timeout: 10
  };
  
  const result = await executeHttpRequest(config, { variables: {} });
  
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(200);
  expect(result.data).toBeDefined();
});
```

### Integration Tests
- Usar mock servers para APIs
- Probar reintentos con fallos simulados
- Validar templates con diferentes contextos

## Mejores Prácticas

### Configuración
1. **Timeouts apropiados**: 15-30s para APIs rápidas, 60-120s para procesos lentos
2. **Reintentos conservadores**: 1-3 reintentos para la mayoría de casos
3. **Headers explícitos**: Siempre incluir Content-Type y Accept
4. **Variables dinámicas**: Usar templates para datos contextuales

### Seguridad
1. **Validar SSL**: Mantener `validateSSL: true` en producción
2. **Headers seguros**: No hardcodear tokens, usar conexiones
3. **URLs validadas**: Validar URLs antes de configurar
4. **Logs limitados**: No logear datos sensibles

### Performance
1. **Timeout balanceado**: No demasiado alto ni muy bajo
2. **Conexiones reutilizables**: HTTP/1.1 keep-alive por defecto
3. **Compresión**: Headers Accept-Encoding automáticos
4. **Monitoring**: Usar MonitorNode para debugging

## Ejemplos de Uso Real

### Integración CRM → Slack
```typescript
{
  name: 'Notificar Lead a Slack',
  method: 'POST',
  url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    text: 'Nuevo lead calificado',
    attachments: [{
      color: 'good',
      fields: [
        { title: 'Nombre', value: '{{trigger.input.leadName}}', short: true },
        { title: 'Email', value: '{{trigger.input.leadEmail}}', short: true },
        { title: 'Valor Estimado', value: '${{trigger.input.leadValue}}', short: true },
        { title: 'Fuente', value: '{{trigger.input.leadSource}}', short: true }
      ]
    }]
  },
  timeout: 15,
  retries: 2
}
```

### Sincronización con API Externa
```typescript
{
  name: 'Sync to External CRM',
  method: 'POST',
  url: 'https://api.external-crm.com/v2/contacts',
  headers: {
    'Authorization': 'Bearer {{connections.external_crm.access_token}}',
    'Content-Type': 'application/json',
    'X-API-Version': '2.0'
  },
  body: {
    contact: {
      firstName: '{{trigger.input.leadName.split(" ")[0]}}',
      lastName: '{{trigger.input.leadName.split(" ")[1]}}',
      email: '{{trigger.input.leadEmail}}',
      phone: '{{trigger.input.leadPhone}}',
      customFields: {
        lead_source: '{{trigger.input.leadSource}}',
        lead_value: '{{trigger.input.leadValue}}',
        processed_at: '{{now}}'
      }
    }
  },
  timeout: 60,
  retries: 3
}
```

## Changelog

### v1.0.0
- ✅ Implementación inicial
- ✅ Soporte completo para métodos HTTP
- ✅ Sistema de reintentos con backoff exponencial
- ✅ Validación con Zod
- ✅ Templates Handlebars
- ✅ Configuración avanzada de UI
- ✅ Documentación completa