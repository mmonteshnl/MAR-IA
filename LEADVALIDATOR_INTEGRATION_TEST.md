# 🧪 Test de Integración - LeadValidatorNode

## ✅ **Estado de la Integración**

### **Completado:**
- ✅ Nodo generado con esquema completo
- ✅ Runner implementado con 3 modos (validator, editor, router)
- ✅ Integrado en sistema de nodos (`nodes/index.ts`)
- ✅ Tipos actualizados en `nodeTypes.ts`
- ✅ FlowExecutor actualizado con soporte para `leadValidator`
- ✅ Operadores de validación implementados (==, !=, >, <, contains, etc.)
- ✅ Documentación completa creada

### **Pendiente:**
- ⏳ Panel de configuración visual (UI Settings)
- ⏳ Testing en flujo real con datos de leads

## 🚀 **Prueba de Integración Manual**

### **1. Configuración de Prueba - Modo Validator**
```javascript
// Ejemplo para agregar en un flujo de testing
const testFlow = {
  nodes: [
    {
      id: "trigger_1",
      type: "trigger",
      data: {
        name: "Trigger Manual",
        config: {}
      }
    },
    {
      id: "leadValidator_1", 
      type: "leadValidator",
      data: {
        name: "Validar Lead Premium",
        config: {
          mode: "validator",
          enableLogging: true,
          logLevel: "verbose",
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
            trueMessage: "✅ Lead premium válido",
            falseMessage: "❌ No cumple criterios premium"
          }
        }
      }
    },
    {
      id: "monitor_1",
      type: "monitor", 
      data: {
        name: "Monitor Results",
        config: {
          displayFields: "isPremiumLead,validationResult",
          outputFormat: "json"
        }
      }
    }
  ],
  edges: [
    { id: "e1", source: "trigger_1", target: "leadValidator_1" },
    { id: "e2", source: "leadValidator_1", target: "monitor_1" }
  ]
};
```

### **2. Datos de Prueba**
```javascript
// Caso 1: Lead Premium (debería retornar true)
const testData1 = {
  leadName: "Empresa Premium S.A.",
  leadEmail: "ceo@empresa-premium.com", 
  leadPhone: "+52 123 456 7890",
  context: "premium",
  leadValue: 25000,
  leadIndustry: "Tecnología"
};

// Caso 2: Lead Estándar (debería retornar false)
const testData2 = {
  leadName: "PyME Local",
  leadEmail: "contacto@pyme.com",
  leadPhone: "+52 987 654 3210", 
  context: "standard",
  leadValue: 3000,
  leadIndustry: "Comercio"
};
```

### **3. Resultado Esperado - Caso Premium**
```javascript
// Output esperado para testData1
{
  success: true,
  mode: "validator",
  validationResult: {
    isValid: true,
    conditionResults: [
      {
        condition: { field: "context", operator: "==", value: "premium" },
        result: true,
        actualValue: "premium"
      },
      {
        condition: { field: "leadValue", operator: ">", value: 5000 },
        result: true, 
        actualValue: 25000
      }
    ],
    finalMessage: "✅ Lead premium válido"
  },
  leadData: {
    before: { /* datos originales */ },
    after: { 
      /* datos originales + isPremiumLead: true */
      isPremiumLead: true 
    }
  }
}
```

### **4. Resultado Esperado - Caso Estándar**
```javascript
// Output esperado para testData2
{
  success: true,
  mode: "validator", 
  validationResult: {
    isValid: false,
    conditionResults: [
      {
        condition: { field: "context", operator: "==", value: "premium" },
        result: false,
        actualValue: "standard"
      },
      {
        condition: { field: "leadValue", operator: ">", value: 5000 },
        result: false,
        actualValue: 3000
      }
    ],
    finalMessage: "❌ No cumple criterios premium"
  },
  leadData: {
    before: { /* datos originales */ },
    after: {
      /* datos originales + isPremiumLead: false */
      isPremiumLead: false
    }
  }
}
```

## 🔧 **Configuraciones de Prueba Adicionales**

### **Modo Editor - Actualizar Prioridad**
```javascript
{
  mode: "editor",
  editorConfig: {
    actions: [
      {
        name: "Clasificar por Valor",
        conditions: [
          { field: "leadValue", operator: ">", value: 10000 }
        ],
        trueActions: {
          updates: [
            { field: "stage", value: "High Priority" },
            { field: "priority", value: 5 }
          ]
        },
        falseActions: {
          updates: [
            { field: "stage", value: "Standard" },
            { field: "priority", value: 3 }
          ]
        }
      }
    ],
    updateDatabase: false // true para testing con BD real
  }
}
```

### **Modo Router - Dirigir Flujo**
```javascript
{
  mode: "router",
  routerConfig: {
    routes: [
      {
        id: "premium",
        name: "Ruta Premium",
        conditions: [
          { field: "context", operator: "==", value: "premium" }
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

## 🎯 **Pasos para Testing Manual**

### **En la Interfaz de Conex:**
1. **Crear nuevo flujo** 
2. **Agregar nodo "Validador de Leads"** desde la paleta
3. **Configurar condiciones** usando la UI
4. **Conectar con Trigger y Monitor**
5. **Ejecutar con datos de prueba**
6. **Verificar resultados** en el Monitor

### **Vía HTTP Testing:**
```bash
# Usando el endpoint de testing HTTP
curl -X POST "http://localhost:3047/api/flows/dev-execute/tu-flujo-con-validator" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "leadName": "Test Lead",
      "context": "premium", 
      "leadValue": 15000
    }
  }'
```

## 🔍 **Logs de Debug Esperados**

Con `logLevel: "verbose"` deberías ver:
```
🔧 LEAD VALIDATOR: Ejecutando Validar Lead Premium en modo validator
📋 LEAD VALIDATOR: Datos del lead recibidos: {context: "premium", leadValue: 25000...}
🔍 VALIDATOR: Resultado = true {conditions: 2, passed: 2}
✅ LEAD VALIDATOR: Completado en 45ms
```

## ⚠️ **Posibles Problemas y Soluciones**

### **Problema: Nodo no aparece en la paleta**
- **Causa**: No se registró correctamente en `nodeTypes`
- **Solución**: Verificar imports en `nodes/index.ts`

### **Problema: Error al ejecutar**
- **Causa**: Configuración inválida o falta context
- **Solución**: Verificar que `leadData` está en el contexto

### **Problema: Condiciones no se evalúan**
- **Causa**: Campo no existe en los datos
- **Solución**: Verificar nombres de campos en `inputData`

## 🎉 **Confirmación de Éxito**

La integración es exitosa cuando:
- ✅ El nodo aparece en la paleta de Conex
- ✅ Se puede arrastrar y configurar
- ✅ Ejecuta sin errores con datos de prueba  
- ✅ Retorna resultados válidos según el modo
- ✅ Los logs muestran ejecución correcta
- ✅ Funciona en endpoint HTTP de testing

---

**Status Actual**: ✅ **Integración Técnica Completa** 
**Próximo Paso**: Crear UI Settings para configuración visual