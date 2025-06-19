# BaseNode Template

Este es un template base para crear nuevos nodos en el FlowBuilder. Proporciona una estructura consistente y escalable para el desarrollo de nodos personalizados.

## 🎯 Propósito

Este template sirve como punto de partida para crear nuevos nodos. Incluye:

- ✅ **Estructura modular completa**
- ✅ **Validación con Zod schemas**
- ✅ **Componente UI responsivo**
- ✅ **Panel de configuración avanzado**
- ✅ **Runner de ejecución pura**
- ✅ **Documentación integrada**
- ✅ **TypeScript completo**

## 📁 Estructura de Archivos

```
BaseNode/
├── index.ts                # Exportaciones principales
├── BaseNode.tsx            # Componente UI para ReactFlow
├── BaseNodeSettings.tsx    # Panel de configuración
├── runner.ts               # Lógica de ejecución pura
├── schema.ts               # Tipos TypeScript y validación Zod
├── constants.ts            # Configuraciones por defecto
└── README.md               # Documentación (este archivo)
```

## 🚀 Cómo Usar Este Template

### 1. Copiar el Template
```bash
# Copiar toda la carpeta
cp -r BaseNode MiNuevoNodo

# Navegar a la nueva carpeta
cd MiNuevoNodo
```

### 2. Renombrar Archivos
```bash
# Renombrar archivos principales
mv BaseNode.tsx MiNuevoNodo.tsx
mv BaseNodeSettings.tsx MiNuevoNodoSettings.tsx

# El resto de archivos mantienen sus nombres
```

### 3. Buscar y Reemplazar

Reemplazar en todos los archivos:
- `BaseNode` → `MiNuevoNodo`
- `baseNode` → `miNuevoNodo`
- `base-node` → `mi-nuevo-nodo`
- `Base Node` → `Mi Nuevo Nodo`

### 4. Actualizar Configuración

#### En `schema.ts`:
```typescript
export const MiNuevoNodoConfigSchema = z.object({
  name: z.string().optional().default('Mi Nuevo Nodo'),
  // Agregar campos específicos aquí
  url: z.string().url(),
  timeout: z.number().min(1).max(300).default(30),
});
```

#### En `constants.ts`:
```typescript
export const MI_NUEVO_NODO_DEFAULTS: MiNuevoNodoConfig = {
  name: 'Mi Nuevo Nodo',
  url: 'https://api.ejemplo.com',
  timeout: 30,
};

export const MI_NUEVO_NODO_METADATA = {
  type: 'miNuevoNodo',
  label: 'Mi Nuevo Nodo',
  icon: Globe, // Importar icono apropiado
  description: 'Descripción específica del nodo',
  category: 'api', // o 'data', 'utility', etc.
};
```

#### En `runner.ts`:
```typescript
export async function executeMiNuevoNodo(
  config: unknown,
  context: ExecutionContext,
  options: RunnerOptions = {}
): Promise<MiNuevoNodoResult> {
  // Implementar lógica específica aquí
  // Ejemplo para API call:
  const response = await fetch(validConfig.url);
  const data = await response.json();
  return { success: true, data, timestamp: new Date().toISOString() };
}
```

### 5. Implementar UI Específica

#### En `MiNuevoNodo.tsx`:
```typescript
// Actualizar icono y colores
<Globe className="h-4 w-4 mr-2 text-blue-400" />

// Agregar información específica
<div className="text-xs text-gray-400">
  {config.url}
</div>
```

#### En `MiNuevoNodoSettings.tsx`:
```typescript
// Agregar campos de configuración específicos
<Input
  value={config.url}
  onChange={(e) => updateConfig({ url: e.target.value })}
  placeholder="https://api.ejemplo.com"
/>
```

### 6. Integrar en el Sistema

#### Actualizar `nodes/index.ts`:
```typescript
import { Component as MiNuevoNodo } from './MiNuevoNodo';

export const nodeTypes = {
  // ... otros nodos
  miNuevoNodo: MiNuevoNodo,
};
```

#### Actualizar `types/nodeTypes.ts`:
```typescript
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

#### Actualizar `FlowExecutor`:
```typescript
case 'miNuevoNodo':
  const { executeMiNuevoNodo } = await import('../components/conex/nodes/MiNuevoNodo/runner');
  return await executeMiNuevoNodo(node.data.config, context, options);
```

## 🧪 Testing

### Tests Unitarios para Runner
```typescript
import { executeMiNuevoNodo } from './runner';

test('should execute successfully with valid config', async () => {
  const config = {
    name: 'Test Node',
    url: 'https://jsonplaceholder.typicode.com/posts/1'
  };
  
  const result = await executeMiNuevoNodo(config, { variables: {} });
  
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
});
```

### Tests de Integración
```typescript
import { render, screen } from '@testing-library/react';
import { MiNuevoNodo } from './MiNuevoNodo';

test('should render with correct configuration', () => {
  const data = {
    config: { name: 'Test Node', url: 'https://api.test.com' }
  };
  
  render(<MiNuevoNodo data={data} />);
  
  expect(screen.getByText('Test Node')).toBeInTheDocument();
});
```

## 📋 Checklist de Implementación

- [ ] Copiar y renombrar archivos
- [ ] Buscar y reemplazar nombres
- [ ] Definir schema de configuración
- [ ] Implementar lógica en runner
- [ ] Actualizar componente UI
- [ ] Configurar panel de settings
- [ ] Actualizar constantes y metadatos
- [ ] Integrar en sistema principal
- [ ] Escribir tests
- [ ] Actualizar documentación

## 🎨 Personalización

### Colores y Estilos
- **Borde del nodo**: Cambiar `border-gray-500` por color específico
- **Icono**: Importar y usar icono apropiado de `lucide-react`
- **Colores de estado**: Personalizar indicadores de loading/error/success

### Funcionalidad
- **Handles**: Ajustar si el nodo necesita entrada/salida
- **Configuración**: Agregar campos específicos al schema
- **Validación**: Implementar validaciones custom en Zod
- **Estados**: Agregar estados específicos del nodo

### Ayuda y Documentación
- **Help Content**: Actualizar ejemplos y tips específicos
- **Tooltips**: Personalizar información mostrada al hacer hover
- **Error Messages**: Implementar mensajes de error específicos

## 🔍 Ejemplos de Nodos Reales

### Nodo HTTP Simple
```typescript
// Configuración básica para peticiones HTTP
{
  name: 'API Call',
  method: 'GET',
  url: 'https://api.ejemplo.com/data',
  headers: { 'Authorization': 'Bearer {{token}}' }
}
```

### Nodo de Transformación
```typescript
// Configuración para transformar datos
{
  name: 'Transform Data',
  mapping: {
    'output.name': 'input.fullName',
    'output.email': 'input.emailAddress'
  }
}
```

### Nodo de Base de Datos
```typescript
// Configuración para consultas DB
{
  name: 'DB Query',
  connectionId: 'postgres-main',
  query: 'SELECT * FROM users WHERE email = {{input.email}}',
  timeout: 30
}
```

## 📚 Recursos Adicionales

- [Documentación de Zod](https://zod.dev/)
- [ReactFlow Documentation](https://reactflow.dev/)
- [Lucide React Icons](https://lucide.dev/)
- [Tailwind CSS Classes](https://tailwindcss.com/docs)

## 🐛 Troubleshooting

### Error: "Schema validation failed"
- Verificar que todos los campos requeridos estén definidos
- Revisar tipos de datos en el schema
- Asegurar que defaults estén correctos

### Error: "Component not rendering"
- Verificar imports en index.ts
- Confirmar que el nodo esté registrado en nodeTypes
- Revisar console para errores de TypeScript

### Error: "Runner not executing"
- Verificar que el runner esté exportado correctamente
- Confirmar integración en FlowExecutor
- Revisar logs de ejecución en consola

---

¡Este template está diseñado para acelerar el desarrollo de nuevos nodos manteniendo consistencia y calidad en todo el sistema!