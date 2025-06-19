# Templates para Nuevos Nodos

Esta carpeta contiene templates y patrones para crear nuevos nodos en el FlowBuilder de manera consistente y escalable.

## 🏗️ Estructura Recomendada

Cada nodo debe seguir la siguiente estructura modular:

```
MyCustomNode/
├── index.ts                    # Exportaciones principales
├── MyCustomNode.tsx            # Componente UI para ReactFlow
├── MyCustomNodeSettings.tsx    # Panel de configuración del nodo
├── runner.ts                   # Lógica de ejecución pura
├── schema.ts                   # Tipos TypeScript y validación Zod
├── constants.ts                # Configuraciones por defecto y metadatos
└── README.md                   # Documentación del nodo
```

## 📋 Checklist para Nuevos Nodos

### 1. Planificación
- [ ] Definir el propósito y funcionalidad del nodo
- [ ] Identificar inputs/outputs necesarios
- [ ] Listar configuraciones requeridas
- [ ] Determinar dependencias externas

### 2. Estructura de Archivos
- [ ] Crear directorio con nombre del nodo en PascalCase
- [ ] Copiar templates de esta carpeta
- [ ] Renombrar archivos según el nombre del nodo
- [ ] Actualizar imports y exports

### 3. Schema y Validación (schema.ts)
- [ ] Definir interfaces TypeScript
- [ ] Crear schemas Zod para validación
- [ ] Documentar todos los campos con comentarios
- [ ] Incluir valores por defecto apropiados

### 4. Constantes y Configuración (constants.ts)
- [ ] Definir configuración por defecto del nodo
- [ ] Agregar metadatos (nombre, icono, descripción)
- [ ] Crear ejemplos de configuración comunes
- [ ] Definir contenido de ayuda en español

### 5. Runner/Lógica (runner.ts)
- [ ] Implementar función principal de ejecución
- [ ] Manejar errores y casos edge apropiadamente
- [ ] Soportar variables dinámicas y templates
- [ ] Incluir logging opcional para debugging
- [ ] Validar inputs con el schema correspondiente

### 6. Componente UI (NodoNombre.tsx)
- [ ] Implementar visualización del nodo en ReactFlow
- [ ] Agregar handles de entrada y salida
- [ ] Mostrar información relevante (estado, configuración)
- [ ] Incluir indicadores visuales (loading, error, success)
- [ ] Agregar tooltip con información detallada

### 7. Panel de Configuración (NodoNombreSettings.tsx)
- [ ] Crear interfaz de configuración intuitiva
- [ ] Validar inputs en tiempo real
- [ ] Incluir ejemplos y configuraciones rápidas
- [ ] Agregar ayuda contextual en español
- [ ] Manejar casos de error graciosamente

### 8. Documentación (README.md)
- [ ] Describir propósito y características del nodo
- [ ] Incluir ejemplos de configuración
- [ ] Documentar formato de respuesta
- [ ] Agregar mejores prácticas de uso
- [ ] Incluir troubleshooting común

### 9. Integración
- [ ] Exportar todo en index.ts
- [ ] Agregar al registro de nodos principal
- [ ] Actualizar FlowExecutor si es necesario
- [ ] Probar integración completa

### 10. Testing y Validación
- [ ] Escribir tests unitarios para el runner
- [ ] Probar validación de schemas
- [ ] Verificar funcionamiento en el builder
- [ ] Probar casos de error y edge cases
- [ ] Validar performance con datos grandes

## 🎯 Principios de Diseño

### Separación de Responsabilidades
- **UI Component**: Solo renderizado y presentación
- **Settings Component**: Solo configuración y validación
- **Runner**: Solo lógica de negocio y ejecución
- **Schema**: Solo validación y tipos
- **Constants**: Solo configuración estática

### Reutilización y Modularity
- Runners deben ser funciones puras independientes
- Settings deben ser reutilizables fuera del FlowBuilder
- UI components deben manejar solo presentación
- Schemas deben ser exportables para validación externa

### Consistencia y UX
- Todos los nodos usan el mismo patrón visual
- Configuraciones siguen la misma estructura
- Errores se manejan de manera consistente
- Ayuda y documentación en español completo

## 🔧 Herramientas Disponibles

### Utilities Compartidas
- `renderTemplate()`: Para procesar variables Handlebars
- `validateConfig()`: Validación genérica con Zod
- `NodeHelpModal`: Modal de ayuda reutilizable
- `toast()`: Notificaciones consistentes

### Hooks y Contextos
- `useFlowExecutor`: Para ejecutar nodos
- `useConnections`: Para acceder a conexiones
- `useFlows`: Para gestión de flujos

### Componentes UI
- Todos los componentes de `@/components/ui`
- Iconos de `lucide-react`
- Styling con Tailwind CSS

## 📚 Ejemplos de Referencia

### Nodo Simple (Solo lectura)
- **MonitorNode**: Debugging y visualización
- Útil para logging, monitoring, debugging

### Nodo Medio (Transformación)
- **DataTransformNode**: Mapeo y transformación
- Útil para manipular datos, filtros, formateo

### Nodo Complejo (API/External)
- **HttpRequestNode**: Peticiones HTTP avanzadas
- Útil para integraciones, webhooks, APIs externas

## ⚡ Quick Start

1. **Copiar template base**:
   ```bash
   cp -r _templates/BaseNode MyNewNode
   ```

2. **Renombrar archivos**:
   ```bash
   mv BaseNode.tsx MyNewNode.tsx
   mv BaseNodeSettings.tsx MyNewNodeSettings.tsx
   # etc...
   ```

3. **Buscar y reemplazar**:
   - `BaseNode` → `MyNewNode`
   - `baseNode` → `myNewNode`
   - `base-node` → `my-new-node`

4. **Implementar lógica específica**:
   - Actualizar schema.ts con tipos reales
   - Implementar runner.ts con funcionalidad
   - Diseñar UI en componente principal
   - Crear configuración en Settings

5. **Integrar en sistema**:
   - Agregar a nodes/index.ts
   - Actualizar FlowExecutor si necesario
   - Probar en FlowBuilder

## 🚀 Próximos Pasos

- Crear CLI/script para generar nodos automáticamente
- Desarrollar más utilities compartidas
- Implementar sistema de plugins
- Agregar marketplace de nodos comunitarios
