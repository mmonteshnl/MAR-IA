# LeadValidatorNode - Validador de Leads

## 📋 Descripción
El **LeadValidatorNode** es un nodo especializado para validar y editar datos de leads en flujos de trabajo. Permite configurar condiciones complejas con operadores lógicos y ejecutar acciones basadas en los resultados de las validaciones.

## 🎯 Casos de Uso

### ✅ **Modo Validator**
Valida condiciones del lead y retorna true/false
- **Ejemplo**: "Si el contexto es 'premium' Y el valor del lead > 5000"
- **Salida**: `isValid: true/false`

### ✏️ **Modo Editor** 
Modifica datos del lead basado en condiciones
- **Ejemplo**: "Si el contexto es 'premium', entonces actualizar stage = 'High Priority'"
- **Salida**: Datos modificados + resumen de cambios

### 🚦 **Modo Router**
Dirige el flujo a diferentes rutas según condiciones
- **Ejemplo**: "Si valor > 10000 → ruta 'enterprise', sino → ruta 'standard'"
- **Salida**: Ruta seleccionada + datos opcionales

## ⚙️ Configuración

### 🔧 **Configuración Principal**
```typescript
{
  name: "Mi Validador",
  mode: "validator" | "editor" | "router",
  enableLogging: true,
  logLevel: "minimal" | "detailed" | "verbose",
  continueOnError: true
}
```

### 🔍 **Operadores de Comparación**
- **Igualdad**: `==`, `!=`
- **Numérica**: `>`, `<`, `>=`, `<=`
- **Texto**: `contains`, `startsWith`, `endsWith`
- **Existencia**: `isEmpty`, `isNotEmpty`
- **Longitud**: `length>`, `length<`, `length==`

### 🔗 **Operadores Lógicos**
- `AND`: Ambas condiciones deben ser verdaderas
- `OR`: Al menos una condición debe ser verdadera

## 📝 **Ejemplos de Configuración**

### 🔍 **Ejemplo: Modo Validator**
```javascript
{
  mode: "validator",
  validatorConfig: {
    conditions: [
      {
        field: "context",
        operator: "==",
        value: "premium",
        logicOperator: "AND"
      },
      {
        field: "leadValue",
        operator: ">",
        value: 5000
      }
    ],
    outputField: "isPremiumLead",
    trueMessage: "Lead premium válido",
    falseMessage: "Lead no cumple criterios premium"
  }
}
```

### ✏️ **Ejemplo: Modo Editor**
```javascript
{
  mode: "editor",
  editorConfig: {
    actions: [
      {
        name: "Clasificar Premium",
        conditions: [
          {
            field: "context",
            operator: "==",
            value: "premium"
          }
        ],
        trueActions: {
          updates: [
            { field: "stage", value: "High Priority" },
            { field: "priority", value: 5 },
            { field: "category", value: "premium" }
          ],
          message: "Lead clasificado como premium"
        },
        falseActions: {
          updates: [
            { field: "category", value: "standard" }
          ],
          message: "Lead clasificado como estándar"
        }
      }
    ],
    updateDatabase: true,
    collection: "leads",
    identifierField: "id"
  }
}
```

### 🚦 **Ejemplo: Modo Router**
```javascript
{
  mode: "router",
  routerConfig: {
    routes: [
      {
        id: "enterprise",
        name: "Ruta Enterprise",
        conditions: [
          {
            field: "leadValue",
            operator: ">",
            value: 50000
          }
        ],
        output: "enterprise_path",
        updates: [
          { field: "tier", value: "enterprise" }
        ]
      },
      {
        id: "premium",
        name: "Ruta Premium",
        conditions: [
          {
            field: "leadValue",
            operator: ">",
            value: 10000
          }
        ],
        output: "premium_path",
        updates: [
          { field: "tier", value: "premium" }
        ]
      }
    ],
    defaultRoute: "standard_path"
  }
}
```

## 📊 **Respuesta del Nodo**

### ✅ **Modo Validator - Respuesta**
```javascript
{
  success: true,
  mode: "validator",
  validationResult: {
    isValid: true,
    conditionResults: [
      {
        condition: { field: "context", operator: "==", value: "premium" },
        result: true,
        actualValue: "premium",
        message: undefined
      }
    ],
    finalMessage: "Validación exitosa"
  },
  leadData: {
    before: { /* datos originales */ },
    after: { /* datos con isValid agregado */ }
  },
  executionTime: 45,
  timestamp: "2025-06-19T19:30:00.000Z"
}
```

### ✏️ **Modo Editor - Respuesta**
```javascript
{
  success: true,
  mode: "editor",
  editorResult: {
    actionsExecuted: 1,
    updatesApplied: 3,
    databaseUpdated: true,
    updatedFields: ["stage", "priority", "category"],
    changes: {
      "stage": "High Priority",
      "priority": 5,
      "category": "premium"
    }
  },
  leadData: {
    before: { /* datos originales */ },
    after: { /* datos modificados */ }
  }
}
```

### 🚦 **Modo Router - Respuesta**
```javascript
{
  success: true,
  mode: "router",
  routerResult: {
    selectedRoute: "premium_path",
    routeName: "Ruta Premium",
    isDefaultRoute: false,
    appliedUpdates: 1
  },
  leadData: {
    before: { /* datos originales */ },
    after: { /* datos con tier agregado */ }
  }
}
```

## 🔧 **Integración en Flujos**

### 📡 **Variables de Entrada**
El nodo busca datos del lead en:
1. `context.variables.leadData`
2. `context.variables.inputData.leadData`
3. `context.variables.trigger.input`
4. `context.variables` (todo el contexto)

### 📤 **Variables de Salida**
- **Validator**: Agrega campo `isValid` (o customizado)
- **Editor**: Datos modificados + metadata de cambios
- **Router**: Datos + información de ruta seleccionada

### 🔗 **Conexiones**
- **Entrada**: Acepta datos de cualquier nodo anterior
- **Salida**: Puede conectarse a múltiples nodos según el modo:
  - **Validator**: Una salida con resultado boolean
  - **Editor**: Una salida con datos modificados
  - **Router**: Múltiples salidas según rutas configuradas

## 🛠️ **Desarrollo y Testing**

### 🧪 **Ejemplo de Testing**
```javascript
import { executeLeadValidatorNode } from './runner';

const config = {
  mode: "validator",
  validatorConfig: {
    conditions: [
      { field: "context", operator: "==", value: "premium" }
    ]
  }
};

const context = {
  variables: {
    leadData: {
      id: "lead-123",
      context: "premium",
      leadValue: 15000
    }
  }
};

const result = await executeLeadValidatorNode(config, context);
console.log(result.validationResult.isValid); // true
```

### 🔍 **Debugging**
Configura `logLevel: "verbose"` para obtener logs detallados:
```
🔧 LEAD VALIDATOR: Ejecutando Mi Validador en modo validator
📋 LEAD VALIDATOR: Datos del lead recibidos: {...}
🔍 VALIDATOR: Resultado = true
✅ LEAD VALIDATOR: Completado en 45ms
```

## 🚀 **Próximos Pasos de Implementación**

1. **Integrar en el sistema de nodos**: Agregar a `nodes/index.ts`
2. **Actualizar FlowExecutor**: Soporte para el nuevo tipo de nodo
3. **Crear UI Settings**: Panel de configuración visual
4. **Testing**: Pruebas unitarias y de integración
5. **Documentación**: Guías de usuario y ejemplos

## ⚠️ **Consideraciones**

- **Performance**: Las validaciones complejas pueden afectar el rendimiento
- **Base de Datos**: El modo editor requiere permisos de escritura
- **Logs**: El nivel 'verbose' puede generar muchos logs en producción
- **Condiciones**: Máximo recomendado: 10 condiciones por acción para mantener legibilidad

## 🎯 **Beneficios**

✅ **Flexibilidad**: Tres modos de operación para diferentes necesidades  
✅ **Escalabilidad**: Soporte para condiciones complejas con operadores lógicos  
✅ **Integración**: Actualización automática de base de datos  
✅ **Debugging**: Logs detallados y información de ejecución  
✅ **Reutilización**: Configuraciones guardables y reutilizables  

---

*Este nodo está diseñado para ser el corazón de la lógica de validación y enrutamiento de leads en flujos de trabajo automatizados.*