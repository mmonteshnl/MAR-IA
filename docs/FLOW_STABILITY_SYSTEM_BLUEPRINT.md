# 🔒 Blueprint: Flow Stability System
*Sistema de Identificadores Estables para Integraciones Externas*

## 📋 Resumen del Sistema

El Flow Stability System resuelve el problema crítico de **estabilidad de IDs** para integraciones externas. Permite que terceros (Postman, webhooks, APIs) usen identificadores que **nunca cambien**, incluso cuando el flujo se modifica.

---

## 🎯 Problema Solucionado

### ❌ **Antes: Problema de Inestabilidad**
```bash
# Usuario crea flujo
flowId: "8p4yn0MWGGoSlHTmY9Fq"

# Usuario modifica flujo desde UI  
# ¿El ID cambia? ¿Se mantiene?
# ⚠️ INCERTIDUMBRE PARA INTEGRACIONES EXTERNAS
```

### ✅ **Después: Estabilidad Garantizada**  
```bash
# Usuario crea flujo con alias
flowId: "8p4yn0MWGGoSlHTmY9Fq"
alias: "lead-processor-v1"

# Usuario modifica flujo -> ID se mantiene, alias NUNCA cambia
# ✅ INTEGRACIONES EXTERNAS SEGURAS
```

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FLOW STABILITY SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   FLOW ID   │    │    ALIAS    │    │ DEFINITION  │     │
│  │ (Technical) │    │  (Stable)   │    │ (Mutable)   │     │
│  │             │    │             │    │             │     │
│  │ 8p4yn0MW... │────│ lead-proc-v1│────│ {...nodes}  │     │
│  │ [Mutable]   │    │ [IMMUTABLE] │    │ [Mutable]   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🔑 **Componentes Principales:**

| Componente | Propósito | Estabilidad | Uso |
|------------|-----------|-------------|-----|
| **Flow ID** | Identificador técnico | ❓ Variable | Base de datos interna |
| **Alias** | Identificador estable | ✅ **INMUTABLE** | APIs externas |
| **Definition** | Configuración del flujo | 🔄 Mutable | Lógica de ejecución |

---

## 📡 Implementación Técnica

### **1. 🗂️ Estructura de Datos**

```typescript
interface Flow {
  id: string;                    // ← ID técnico (puede cambiar)
  alias?: string;                // ← ALIAS ESTABLE (nunca cambia)
  name: string;
  description: string;
  definition: Record<string, any>; // ← Puede modificarse
  // ... otros campos
}
```

### **2. 🔍 Lógica de Búsqueda Dual**

```typescript
// Función helper que busca por ID O alias
const findFlowByIdentifier = async (identifier: string) => {
  // 1. Buscar por ID directo
  let flow = await findById(identifier);
  if (flow) return flow;
  
  // 2. Buscar por alias
  flow = await findByAlias(identifier);
  if (flow) return flow;
  
  return null;
};
```

### **3. 🛠️ API Endpoints Actualizados**

#### **GET: Información por ID o Alias**
```http
GET /api/flows/dev-execute?id=8p4yn0MWGGoSlHTmY9Fq
GET /api/flows/dev-execute?alias=lead-processor-v1
```

#### **POST: Ejecución por ID o Alias**
```json
// Opción A: Por ID técnico
{
  "flowId": "8p4yn0MWGGoSlHTmY9Fq",
  "inputData": {...}
}

// Opción B: Por alias estable
{
  "flowAlias": "lead-processor-v1", 
  "inputData": {...}
}
```

---

## 🎛️ Gestión de Aliases

### **📝 Creación de Alias**

#### **Opción A: Manual (Recomendado)**
```typescript
// Usuario asigna alias al crear flujo
const newFlow = {
  name: "Lead Processor",
  alias: "lead-processor-v1",  // ← Usuario define
  description: "...",
  // ...
}
```

#### **Opción B: Auto-generado**
```typescript
// Sistema genera alias automáticamente
const generateAlias = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-') + '-v1';
};

// "Lead Processor" → "lead-processor-v1"
```

### **🔒 Reglas de Alias**

1. **✅ Inmutable**: Una vez asignado, nunca cambia
2. **✅ Único**: No puede haber duplicados en la organización
3. **✅ Opcional**: Flujos sin alias siguen funcionando por ID
4. **✅ Válido**: Solo letras, números, guiones y guiones bajos
5. **✅ Legible**: Preferiblemente descriptivo

### **📋 Validación de Alias**

```typescript
const validateAlias = (alias: string): boolean => {
  // 1. Formato válido
  const isValidFormat = /^[a-z0-9_-]+$/.test(alias);
  
  // 2. Longitud apropiada
  const isValidLength = alias.length >= 3 && alias.length <= 50;
  
  // 3. No comienza/termina con guión
  const isValidBoundary = !alias.startsWith('-') && !alias.endsWith('-');
  
  return isValidFormat && isValidLength && isValidBoundary;
};
```

---

## 🔄 Escenarios de Uso

### **📊 Caso 1: Integración de Postman**

```bash
# ✅ ANTES: Usuario crea flujo con alias
curl -X POST "/api/flows" -d '{
  "name": "Lead Processor",
  "alias": "lead-proc-main",
  "definition": {...}
}'

# ✅ DURANTE: Usuario usa alias en Postman
curl -X POST "/api/flows/dev-execute" -d '{
  "flowAlias": "lead-proc-main",
  "inputData": {...}
}'

# ✅ DESPUÉS: Usuario modifica flujo (alias se mantiene)
# ✅ Postman sigue funcionando sin cambios
```

### **📊 Caso 2: Webhook Automatizado**

```python
# Sistema externo usa alias para estabilidad
def process_webhook(data):
    response = requests.post(
        'http://api.example.com/flows/dev-execute',
        json={
            'flowAlias': 'webhook-processor',  # ← Nunca cambia
            'inputData': data
        }
    )
    return response.json()
```

### **📊 Caso 3: Microservicios**

```javascript
// Microservicio con configuración estable
const config = {
  flows: {
    leadProcessing: 'lead-processor-v1',     // ← Alias estable
    emailNotification: 'email-notify-v2',   // ← Alias estable
    dataValidation: 'validator-main'         // ← Alias estable
  }
};

// Ejecución confiable
const result = await executeFlow(config.flows.leadProcessing, inputData);
```

---

## 📋 Casos de Migración

### **🔄 Migración de Flujos Existentes**

#### **Estrategia A: Retrocompatible**
```typescript
// Flujos sin alias siguen funcionando por ID
const existingFlows = await getFlows();
existingFlows.forEach(flow => {
  // Si no tiene alias, el ID sigue siendo válido
  console.log(`Flow: ${flow.id} (alias: ${flow.alias || 'none'})`);
});
```

#### **Estrategia B: Migración Gradual**
```typescript
// Permitir asignar alias a flujos existentes
const addAliasToExistingFlow = async (flowId: string, alias: string) => {
  await updateFlow(flowId, { alias });
  console.log(`✅ Alias "${alias}" agregado a flujo ${flowId}`);
};
```

### **⚠️ Conflictos de Alias**

```typescript
// Detección y resolución de conflictos
const handleAliasConflict = async (proposedAlias: string) => {
  const existingFlow = await findByAlias(proposedAlias);
  
  if (existingFlow) {
    // Sugerir alternativas
    const suggestions = [
      `${proposedAlias}-v2`,
      `${proposedAlias}-new`, 
      `${proposedAlias}-${Date.now()}`
    ];
    
    throw new Error(`Alias "${proposedAlias}" already exists. Try: ${suggestions.join(', ')}`);
  }
};
```

---

## 🛡️ Beneficios del Sistema

### **✅ Para Desarrolladores Externos**
- **🔒 Estabilidad**: URLs y IDs nunca cambian
- **📝 Legibilidad**: Alias descriptivos vs IDs crípticos  
- **🔄 Flexibilidad**: Pueden usar ID o alias según preferencia
- **📊 Versionado**: Aliases con versiones (`v1`, `v2`)

### **✅ Para Administradores**
- **🎛️ Control**: Gestión manual de aliases importantes
- **📋 Trazabilidad**: Fácil identificación de flujos en logs
- **🔄 Migración**: Cambio de backends sin romper integraciones
- **📊 Organización**: Aliases como documentación viviente

### **✅ Para el Sistema**
- **🔄 Retrocompatibilidad**: IDs existentes siguen funcionando
- **⚡ Performance**: Búsqueda dual optimizada con índices
- **🗂️ Escalabilidad**: Sistema funciona con miles de flujos
- **🛠️ Mantenibilidad**: Separación clara de responsabilidades

---

## 📈 Métricas y Monitoreo

### **📊 KPIs del Sistema**

```typescript
interface StabilityMetrics {
  // Adopción de aliases
  flowsWithAlias: number;
  aliasUsagePercentage: number;
  
  // Estabilidad de integraciones
  externalCallsByAlias: number;
  externalCallsByDirectId: number;
  
  // Conflictos y errores
  aliasConflicts: number;
  deprecatedIdUsage: number;
}
```

### **🔍 Logs de Auditoría**

```typescript
// Trackear uso de aliases vs IDs
const logFlowAccess = (identifier: string, accessType: 'id' | 'alias') => {
  console.log({
    timestamp: new Date().toISOString(),
    identifier,
    accessType,
    source: 'external_api',
    stable: accessType === 'alias'
  });
};
```

---

## 🚀 Próximos Pasos

### **📋 Roadmap de Implementación**

1. **✅ Fase 1: Core System** (Completado)
   - ✅ Actualizar tipos TypeScript
   - ✅ Implementar búsqueda dual
   - ✅ Actualizar API endpoints

2. **🔄 Fase 2: UI Integration** (Próximo)
   - 🔄 Agregar campo alias en creación de flujos
   - 🔄 Mostrar alias en listado de flujos
   - 🔄 Validación en tiempo real

3. **📋 Fase 3: Management Tools** (Futuro)
   - 📋 Dashboard de aliases
   - 📋 Herramientas de migración
   - 📋 Analytics de uso

4. **🎯 Fase 4: Advanced Features** (Futuro)
   - 🎯 Versionado automático de aliases
   - 🎯 Políticas de naming
   - 🎯 Alias temporal/permanent

---

## 🔧 Configuración Técnica

### **⚙️ Variables de Entorno**

```bash
# Habilitar/deshabilitar sistema de aliases
ENABLE_FLOW_ALIASES=true

# Política de aliases obligatorios para nuevos flujos
REQUIRE_ALIAS_FOR_NEW_FLOWS=false

# Longitud máxima de alias
MAX_ALIAS_LENGTH=50
```

### **🗂️ Índices de Base de Datos**

```javascript
// Firestore: Crear índices para búsqueda eficiente
// Índice compuesto para organizaciones + alias
db.collection('organizations/{orgId}/flows')
  .createIndex(['alias', 'isEnabled']);

// Índice para búsqueda global de aliases (dev mode)
db.collection('dev-flows')
  .createIndex(['alias']);
```

---

## 📚 Documentación para Desarrolladores

### **🎯 Quick Start**

```bash
# 1. Crear flujo con alias
curl -X POST "/api/flows" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Flujo Estable",
    "alias": "mi-flujo-v1",
    "definition": {...}
  }'

# 2. Ejecutar por alias (RECOMENDADO)
curl -X POST "/api/flows/dev-execute" \
  -H "Content-Type: application/json" \
  -d '{
    "flowAlias": "mi-flujo-v1",
    "inputData": {...}
  }'

# 3. Obtener info por alias
curl -X GET "/api/flows/dev-execute?alias=mi-flujo-v1"
```

### **⚠️ Mejores Prácticas**

1. **🎯 Usar aliases para integraciones críticas**
2. **📝 Aliases descriptivos y versionados**
3. **🔒 Documentar aliases en código/configuración**
4. **📊 Monitorear uso de aliases vs IDs**
5. **🔄 Planificar estrategia de migración**

---

## 🎉 Conclusión

El **Flow Stability System** proporciona la **estabilidad y confiabilidad** que las integraciones externas necesitan, mientras mantiene la **flexibilidad** para evolución interna del sistema.

**✅ Resultado**: Integraciones externas pueden confiar en identificadores que **nunca cambiarán**, independientemente de modificaciones internas al flujo.

---

*Blueprint creado el: 19 de Junio, 2025*  
*Sistema: CMR Flow Stability System*  
*Versión: 1.0*  
*Estado: ✅ Implementado*