# Sistema de Nodos del FlowBuilder

Este directorio contiene el sistema modular de nodos para el FlowBuilder de Conex. Cada nodo sigue una arquitectura escalable y consistente que facilita el desarrollo, mantenimiento y testing.

## 🏗️ Arquitectura del Sistema

### Estructura Modular
Cada nodo se organiza en su propia carpeta con una estructura consistente:

```
NodoEjemplo/
├── index.ts                    # Exportaciones principales
├── NodoEjemplo.tsx             # Componente UI para ReactFlow
├── NodoEjemploSettings.tsx     # Panel de configuración
├── runner.ts                   # Lógica de ejecución pura
├── schema.ts                   # Tipos TypeScript y validación Zod
├── constants.ts                # Configuraciones por defecto
└── README.md                   # Documentación específica
```

### Separación de Responsabilidades

1. **UI Component** (`NodoEjemplo.tsx`)
   - Renderizado visual en ReactFlow
   - Handles de entrada y salida
   - Indicadores de estado
   - Información contextual

2. **Settings Component** (`NodoEjemploSettings.tsx`)
   - Interfaz de configuración
   - Validación en tiempo real
   - Ejemplos y ayuda contextual

3. **Runner** (`runner.ts`)
   - Lógica de ejecución pura
   - Independiente de UI y ReactFlow
   - Testeable unitariamente
   - Reutilizable en backend

4. **Schema** (`schema.ts`)
   - Validación con Zod
   - Tipos TypeScript
   - Definición de interfaces

5. **Constants** (`constants.ts`)
   - Configuración por defecto
   - Metadatos del nodo
   - Ejemplos predefinidos

## 📂 Nodos Disponibles

### Nodos en Estructura Nueva (Modular)
- **HttpRequestNode** ✅ - Peticiones HTTP avanzadas con reintentos y timeouts

### Nodos en Estructura Legacy (Por migrar)
- **TriggerNode** - Disparador manual de flujos
- **ApiCallNode** - Llamadas API básicas
- **DataTransformNode** - Transformación de datos
- **MonitorNode** - Debug y monitoreo

## 🚀 Desarrollo de Nuevos Nodos

### Opción 1: Usar el Generador Automático
```bash
# Navegar al directorio de templates
cd src/components/conex/nodes/_templates

# Generar un nuevo nodo
node generate-node.js MiNuevoNodo "Mi Nuevo Nodo" api Globe blue

# Esto crea:
# - Estructura completa de archivos
# - Nombres y referencias actualizados
# - Configuración básica lista
```

### Opción 2: Copiar Template Manualmente
```bash
# Copiar template base
cp -r _templates/BaseNode MiNuevoNodo

# Renombrar archivos
cd MiNuevoNodo
mv BaseNode.tsx MiNuevoNodo.tsx
mv BaseNodeSettings.tsx MiNuevoNodoSettings.tsx

# Buscar y reemplazar:
# BaseNode → MiNuevoNodo
# baseNode → miNuevoNodo
# Base Node → Mi Nuevo Nodo
```

### Pasos de Integración

1. **Implementar Lógica**
   ```typescript
   // En runner.ts
   export async function executeMiNuevoNodo(
     config: unknown,
     context: ExecutionContext
   ): Promise<MiNuevoNodoResult> {
     // Lógica específica del nodo
   }
   ```

2. **Registrar en el Sistema**
   ```typescript
   // En nodes/index.ts
   import { Component as MiNuevoNodo } from './MiNuevoNodo';
   
   export const nodeTypes = {
     // ... otros nodos
     miNuevoNodo: MiNuevoNodo,
   };
   ```

3. **Actualizar Metadatos**
   ```typescript
   // En types/nodeTypes.ts
   export const NODE_TYPES: NodeType[] = [
     // ... otros tipos
     { 
       type: 'miNuevoNodo', 
       label: 'Mi Nuevo Nodo', 
       icon: Globe, 
       description: 'Descripción del nodo' 
     },
   ];
   ```

4. **Integrar en FlowExecutor**
   ```typescript
   // En lib/flow-executor.ts
   case 'miNuevoNodo':
     const { executeMiNuevoNodo } = await import('../components/conex/nodes/MiNuevoNodo/runner');
     return await executeMiNuevoNodo(node.data.config, context, options);
   ```

## 🧪 Testing

### Tests Unitarios
```typescript
// Ejemplo de test para runner
import { executeMiNuevoNodo } from './runner';

describe('MiNuevoNodo Runner', () => {
  test('should execute successfully', async () => {
    const config = { name: 'Test Node' };
    const context = { variables: {} };
    
    const result = await executeMiNuevoNodo(config, context);
    
    expect(result.success).toBe(true);
  });
});
```

### Tests de Integración
```typescript
// Ejemplo de test para componente
import { render, screen } from '@testing-library/react';
import { MiNuevoNodo } from './MiNuevoNodo';

test('should render correctly', () => {
  const data = { config: { name: 'Test' } };
  render(<MiNuevoNodo data={data} />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

## 📋 Categorías de Nodos

### API & Integrations
- **HttpRequestNode** - Peticiones HTTP avanzadas
- **ApiCallNode** - Llamadas API básicas
- **WebhookNode** - Recepción de webhooks

### Data Processing
- **DataTransformNode** - Transformación de datos
- **FilterNode** - Filtrado de datos
- **AggregateNode** - Agregación de datos

### Database
- **DatabaseQueryNode** - Consultas SQL
- **DatabaseInsertNode** - Inserción de datos
- **DatabaseUpdateNode** - Actualización de datos

### Messaging
- **EmailNode** - Envío de emails
- **SlackNode** - Notificaciones Slack
- **WhatsAppNode** - Mensajes WhatsApp

### AI & Analytics
- **AIAnalysisNode** - Análisis con IA
- **TextProcessingNode** - Procesamiento de texto
- **SentimentAnalysisNode** - Análisis de sentimientos

### Utility
- **TriggerNode** - Disparadores
- **MonitorNode** - Debug y monitoreo
- **DelayNode** - Esperas y delays

## 🎯 Principios de Diseño

### 1. Modularidad
- Cada nodo es independiente
- Runners son funciones puras
- UI separado de lógica de negocio

### 2. Consistencia
- Misma estructura de archivos
- Convenciones de nombres uniformes
- Patrones de UI/UX consistentes

### 3. Testabilidad
- Runners testeable unitariamente
- Componentes con props claras
- Mocks y fixtures disponibles

### 4. Escalabilidad
- Fácil agregar nuevos nodos
- Template automatizado
- Documentación integrada

### 5. Reutilización
- Runners usables en backend
- Componentes reutilizables
- Utilities compartidas

## 🔧 Utilities Compartidas

### Validation
```typescript
import { validateConfig } from '../utils/validation';
const result = validateConfig(MyNodeSchema, config);
```

### Template Processing
```typescript
import { renderTemplate } from '../utils/templates';
const processed = renderTemplate(template, context);
```

### UI Components
```typescript
import { NodeHelpModal } from '../components/NodeHelpModal';
import { StatusIndicator } from '../components/StatusIndicator';
```

## 📚 Migración de Nodos Legacy

### Estado de Migración

| Nodo | Estado | Prioridad | Notas |
|------|--------|-----------|-------|
| HttpRequestNode | ✅ Completado | Alta | Implementación completa |
| TriggerNode | 🔄 Pendiente | Media | Nodo simple |
| ApiCallNode | 🔄 Pendiente | Alta | Reemplazar por HttpRequest |
| DataTransformNode | 🔄 Pendiente | Media | Lógica compleja |
| MonitorNode | 🔄 Pendiente | Baja | Funcionalidad estable |

### Proceso de Migración

1. **Análisis** - Revisar nodo legacy
2. **Generación** - Usar template para estructura
3. **Migración** - Mover lógica al runner
4. **Testing** - Verificar funcionalidad
5. **Integración** - Actualizar sistema
6. **Cleanup** - Eliminar código legacy

## 🚀 Roadmap

### Próximas Funcionalidades
- [ ] CLI tool para generar nodos
- [ ] Marketplace de nodos comunitarios
- [ ] Sistema de plugins
- [ ] Versionado de nodos
- [ ] Hot-reloading de nodos
- [ ] Documentación interactiva

### Mejoras Planificadas
- [ ] Mejor sistema de tipos
- [ ] Validación en tiempo real
- [ ] Performance monitoring
- [ ] Error boundaries
- [ ] Undo/Redo support

## 📖 Documentación Adicional

- [Template BaseNode](./_templates/BaseNode/README.md) - Guía detallada del template
- [HttpRequestNode](./HttpRequestNode/README.md) - Ejemplo de implementación completa
- [Generador de Nodos](./_templates/README.md) - Guía de herramientas de desarrollo

## 🐛 Troubleshooting

### Problemas Comunes

**Error: "Node not found in nodeTypes"**
- Verificar registro en `nodes/index.ts`
- Confirmar export correcto en `index.ts` del nodo

**Error: "Schema validation failed"**
- Revisar schema Zod en `schema.ts`
- Verificar tipos de datos y valores default

**Error: "Runner not executing"**
- Confirmar integración en FlowExecutor
- Verificar function name y exports

**Error: "Component not rendering"**
- Revisar imports de ReactFlow
- Confirmar estructura JSX correcta

### Debug Tips
- Usar `NODE_ENV=development` para logs adicionales
- Verificar console para errores de TypeScript
- Usar React DevTools para inspeccionar props
- Revisar Network tab para problemas de imports

---

Este sistema proporciona una base sólida y escalable para el desarrollo de nodos en el FlowBuilder, manteniendo consistencia y facilitando el mantenimiento a largo plazo.