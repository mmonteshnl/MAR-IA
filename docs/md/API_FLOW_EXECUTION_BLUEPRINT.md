# 🚀 Blueprint: API Flow Execution System

## 📋 Resumen del Sistema

El sistema permite ejecutar flujos de automatización desde herramientas externas como Postman, curl, o cualquier cliente HTTP. Los flujos pueden hacer llamadas HTTP reales y devolver resultados estructurados.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   POSTMAN/CURL  │    │   NEXT.JS API   │    │   FIRESTORE     │
│                 │────│                 │────│                 │
│ • HTTP Requests │    │ • Flow Executor │    │ • Flow Storage  │
│ • JSON Payloads │    │ • Node Processor│    │ • Organization  │
│ • Response Data │    │ • API Endpoints │    │ • Connections   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              │
                       ┌─────────────────┐
                       │  EXTERNAL APIs  │
                       │                 │
                       │ • HTTP Requests │
                       │ • Real API Calls│
                       │ • Data Responses│
                       └─────────────────┘
```

---

## 🔄 Flujo de Ejecución Completo

### 📊 Diagrama de Secuencia

```
Cliente (Postman)     API Gateway        Flow Executor       External API       Monitor Node
       │                   │                   │                   │                │
       │ 1. POST Execute    │                   │                   │                │
       │───────────────────▶│                   │                   │                │
       │                   │ 2. Validate       │                   │                │
       │                   │───────────────────▶│                   │                │
       │                   │                   │ 3. Process Trigger │                │
       │                   │                   │───────────────────▶│                │
       │                   │                   │ 4. HTTP Request    │                │
       │                   │                   │───────────────────▶│                │
       │                   │                   │ 5. API Response    │                │
       │                   │                   │◀───────────────────│                │
       │                   │                   │ 6. Process Monitor │                │
       │                   │                   │───────────────────────────────────▶│
       │                   │                   │ 7. Capture Data    │                │
       │                   │                   │◀───────────────────────────────────│
       │                   │ 8. Return Results │                   │                │
       │                   │◀───────────────────│                   │                │
       │ 9. JSON Response   │                   │                   │                │
       │◀───────────────────│                   │                   │                │
```

---

## 🛠️ Endpoints Disponibles

### 📍 **1. Listar Flujos**
```http
GET /api/flows/list
```

**Funcionalidad:**
- Busca flujos en Firestore
- Retorna metadatos básicos
- Incluye endpoints para ejecución

**Respuesta:**
```json
{
  "flows": [
    {
      "id": "flow123",
      "name": "Lead Processing",
      "nodeCount": 3,
      "endpoints": {
        "execute": "/api/flows/dev-execute",
        "info": "/api/flows/dev-execute?id=flow123"
      }
    }
  ],
  "total": 1
}
```

### 📍 **2. Información de Flujo**
```http
GET /api/flows/dev-execute?id=FLOW_ID
```

**Funcionalidad:**
- Obtiene definición completa del flujo
- Muestra estructura de nodos
- Retorna metadatos de configuración

### 📍 **3. Ejecutar Flujo**
```http
POST /api/flows/dev-execute
```

**Body Opciones:**

**Opción A: Por ID de Flujo**
```json
{
  "flowId": "8p4yn0MWGGoSlHTmY9Fq",
  "inputData": {
    "leadName": "John Doe",
    "leadEmail": "john@example.com"
  }
}
```

**Opción B: Flujo Personalizado**
```json
{
  "flowDefinition": {
    "nodes": [...],
    "edges": [...]
  },
  "inputData": {...}
}
```

### 📍 **4. Estado de Ejecución**
```http
GET /api/flows/status/EXECUTION_ID
```

---

## ⚙️ Procesamiento Interno

### 🔄 **Flow Executor Pipeline**

```
INPUT DATA
    │
    ▼
┌─────────────────┐
│ 1. VALIDATION   │ ── Validate flow structure
│                 │ ── Check required fields
│                 │ ── Sanitize input data
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 2. NODE SORTING │ ── Separate Monitor nodes
│                 │ ── Order execution sequence
│                 │ ── Build dependency graph
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 3. SEQUENTIAL   │ ── Process Trigger nodes
│    EXECUTION    │ ── Execute HTTP requests
│                 │ ── Transform data
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 4. MONITOR      │ ── Capture all results
│    PROCESSING   │ ── Format output
│                 │ ── Generate logs
└─────────────────┘
    │
    ▼
FINAL RESULTS
```

### 🎯 **Tipos de Nodos Soportados**

| Tipo | Descripción | Acción |
|------|-------------|--------|
| `trigger` | Punto de entrada | Inicializa con inputData |
| `httpRequest` | Llamada HTTP | **Hace llamada HTTP real** |
| `apiCall` | API genérica | Simulación o llamada real |
| `dataTransform` | Transformación | Procesa y modifica datos |
| `monitor` | Debug/Logging | Captura todo el contexto |

---

## 📡 Ejemplo Completo: Flujo GET API

### 🚀 **Paso 1: Definir el Flujo**
```json
{
  "flowDefinition": {
    "nodes": [
      {
        "id": "trigger1",
        "type": "trigger",
        "data": {
          "name": "Manual Trigger",
          "config": {}
        }
      },
      {
        "id": "http1", 
        "type": "httpRequest",
        "data": {
          "name": "JSONPlaceholder API",
          "config": {
            "method": "GET",
            "url": "https://jsonplaceholder.typicode.com/posts/1",
            "headers": {
              "Accept": "application/json"
            },
            "timeout": 30
          }
        }
      },
      {
        "id": "monitor1",
        "type": "monitor", 
        "data": {
          "name": "Debug Monitor",
          "config": {
            "outputFormat": "json",
            "enableTimestamp": true
          }
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger1",
        "target": "http1"
      },
      {
        "id": "e2", 
        "source": "http1",
        "target": "monitor1"
      }
    ]
  },
  "inputData": {
    "leadName": "API Test User",
    "leadEmail": "test@example.com"
  }
}
```

### 📊 **Paso 2: Ejecución Interna**

```
🔥 INICIO
│
├─ 1️⃣ TRIGGER NODE (trigger1)
│   ├─ Input: {"leadName": "API Test User", "leadEmail": "test@example.com"}
│   ├─ Output: {"success": true, "input": {...}, "timestamp": "..."}
│   └─ ✅ Completado
│
├─ 2️⃣ HTTP REQUEST NODE (http1)
│   ├─ Method: GET
│   ├─ URL: https://jsonplaceholder.typicode.com/posts/1
│   ├─ 🌐 LLAMADA HTTP REAL
│   ├─ Response: {"userId": 1, "id": 1, "title": "...", "body": "..."}
│   ├─ Status: 200
│   └─ ✅ Completado
│
├─ 3️⃣ MONITOR NODE (monitor1)
│   ├─ Captura datos del Trigger
│   ├─ Captura respuesta del HTTP Request
│   ├─ Formatea salida JSON
│   └─ ✅ Completado
│
└─ 🎉 RESULTADO FINAL
```

### 📋 **Paso 3: Respuesta Estructurada**

```json
{
  "success": true,
  "executionId": "exec_1703123456789",
  "timestamp": "2025-06-19T16:30:45.123Z",
  "inputData": {
    "leadName": "API Test User",
    "leadEmail": "test@example.com"
  },
  "nodesExecuted": 3,
  "results": {
    "trigger1": {
      "success": true,
      "input": {
        "leadName": "API Test User",
        "leadEmail": "test@example.com"
      },
      "timestamp": "2025-06-19T16:30:45.100Z"
    },
    "http1": {
      "success": true,
      "status": 200,
      "statusText": "OK",
      "data": {
        "userId": 1,
        "id": 1,
        "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
        "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
      },
      "headers": {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "max-age=43200"
      },
      "timestamp": "2025-06-19T16:30:45.200Z",
      "realApiCall": true
    },
    "monitor1": {
      "success": true,
      "monitorName": "Debug Monitor",
      "timestamp": "2025-06-19T16:30:45.300Z",
      "dataSnapshot": {
        "trigger": {
          "input": {
            "leadName": "API Test User",
            "leadEmail": "test@example.com"
          }
        },
        "stepResults": {
          "step_trigger1": { /* datos del trigger */ },
          "step_http1": { /* datos del HTTP request */ }
        },
        "currentVariables": { /* todas las variables disponibles */ }
      },
      "formattedOutput": "{ /* JSON formateado */ }"
    }
  },
  "summary": {
    "totalNodes": 3,
    "successfulNodes": 3,
    "failedNodes": 0,
    "apiCalls": 1
  }
}
```

---

## 🔒 Seguridad y Limitaciones

### ✅ **Características de Seguridad**
- Solo disponible en modo desarrollo
- Sin autenticación (desarrollo únicamente)
- Limitación de nodos por flujo
- Timeout en llamadas HTTP
- Validación de estructura de flujos

### ⚠️ **Limitaciones Actuales**
- No persiste estado de ejecución
- Sin rate limiting
- Sin autenticación en dev mode
- Máximo 10 flujos por organización en listado

---

## 🧪 Casos de Uso

### 📈 **1. Testing de APIs**
```bash
curl -X POST http://localhost:3047/api/flows/dev-execute \
  -H "Content-Type: application/json" \
  -d '{
    "flowDefinition": {
      "nodes": [
        {"id": "trigger1", "type": "trigger", "data": {"config": {}}},
        {"id": "http1", "type": "httpRequest", "data": {"config": {"method": "GET", "url": "https://api.ejemplo.com/datos"}}}
      ],
      "edges": [{"source": "trigger1", "target": "http1"}]
    },
    "inputData": {"param": "value"}
  }'
```

### 🔄 **2. Automatización de Procesos**
```javascript
// Desde una aplicación JavaScript
const response = await fetch('http://localhost:3047/api/flows/dev-execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    flowId: 'mi-flujo-de-leads',
    inputData: {
      leadName: 'Nuevo Cliente',
      leadEmail: 'cliente@empresa.com',
      leadValue: 25000
    }
  })
});

const result = await response.json();
console.log('Flujo ejecutado:', result);
```

### 📊 **3. Integración con Webhooks**
```python
# Desde Python/Flask webhook
import requests

def webhook_handler(data):
    flow_response = requests.post(
        'http://localhost:3047/api/flows/dev-execute',
        json={
            'flowId': 'webhook-processor',
            'inputData': data
        }
    )
    return flow_response.json()
```

---

## 🎯 Ventajas del Sistema

✅ **Flexibilidad** - Ejecuta flujos existentes o define nuevos  
✅ **Llamadas Reales** - HTTPRequest hace llamadas HTTP reales  
✅ **Debugging** - Monitor captura todo el contexto  
✅ **Integración** - Compatible con cualquier herramienta HTTP  
✅ **Escalabilidad** - Procesamiento asíncrono de nodos  
✅ **Visibilidad** - Respuestas detalladas con metadatos  

---

## 🚀 Próximos Pasos

1. **Autenticación** - Añadir API keys para producción
2. **Persistencia** - Guardar estado de ejecuciones
3. **Rate Limiting** - Controlar frecuencia de ejecuciones
4. **Webhooks** - Notificaciones de completado
5. **UI Dashboard** - Interfaz para monitorear ejecuciones
6. **Métricas** - Analytics de performance y uso

---

*Blueprint creado el: 19 de Junio, 2025*  
*Sistema: CMR Flow Execution API*  
*Versión: 1.0*