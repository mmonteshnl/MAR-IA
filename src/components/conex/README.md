# FlowBuilder - Arquitectura Modular

## 📁 Estructura de Carpetas

```
src/components/conex/
├── nodes/                   # Componentes de nodos individuales
│   ├── TriggerNode.tsx     # Nodo trigger manual
│   ├── ApiCallNode.tsx     # Nodo API genérico
│   ├── PandaDocNode.tsx    # Nodo PandaDoc especializado
│   ├── DataTransformNode.tsx # Nodo transformación de datos
│   ├── MonitorNode.tsx     # Nodo monitor/debug
│   └── index.ts            # Exports de todos los nodos
├── settings/               # Paneles de configuración por nodo
│   ├── ApiCallSettings.tsx
│   ├── PandaDocSettings.tsx
│   ├── MonitorSettings.tsx
│   ├── DataTransformSettings.tsx
│   └── index.ts
├── panels/                 # Paneles del FlowBuilder
│   ├── NodesPanel.tsx      # Panel de nodos disponibles
│   ├── NodeSettings.tsx    # Panel de configuración de nodo
│   └── index.ts
├── types/                  # Tipos TypeScript
│   ├── index.ts            # Tipos principales
│   └── nodeTypes.ts        # Definiciones de tipos de nodos
├── FlowBuilderCore.tsx     # Lógica principal del FlowBuilder
├── FlowBuilderNew.tsx      # Wrapper con ReactFlowProvider
├── FlowBuilder.tsx         # Archivo original (legacy)
├── index.ts                # Exports principales
└── README.md               # Esta documentación
```

## 🧩 Componentes Principales

### FlowBuilder
- **Archivo**: `FlowBuilderNew.tsx`
- **Propósito**: Componente principal que envuelve FlowBuilderCore con ReactFlowProvider
- **Props**: `FlowBuilderProps`

### FlowBuilderCore
- **Archivo**: `FlowBuilderCore.tsx` 
- **Propósito**: Contiene toda la lógica del FlowBuilder
- **Responsabilidades**:
  - Manejo de estado de nodos y edges
  - Drag & drop functionality
  - Eventos de teclado (Delete)
  - Conexión entre nodos

## 🎯 Nodos Disponibles

### TriggerNode
- **Color**: Verde (`border-green-500`)
- **Icono**: ⚡ Zap
- **Función**: Punto de inicio del flujo

### ApiCallNode  
- **Color**: Azul (`border-blue-500`)
- **Icono**: 🔗 Link
- **Función**: Llamadas HTTP genéricas

### PandaDocNode
- **Color**: Naranja (`border-orange-500`) 
- **Icono**: 📄 Emoji
- **Función**: Integración con PandaDoc API

### DataTransformNode
- **Color**: Púrpura (`border-purple-500`)
- **Icono**: 🔄 RefreshCw
- **Función**: Transformación de datos JSON

### MonitorNode
- **Color**: Cian (`border-cyan-500`)
- **Icono**: 🔍 Monitor  
- **Función**: Debug y monitoreo de datos

## ⚙️ Configuración de Nodos

Cada nodo tiene su propio componente de settings:

- `ApiCallSettings`: Method, URL, Headers, Body
- `PandaDocSettings`: API Key, Template ID, Document Name
- `MonitorSettings`: Display Fields, Output Format, Timestamp
- `DataTransformSettings`: JSON transformations

## 🚀 Cómo Agregar un Nuevo Nodo

### 1. Crear el Componente del Nodo
```tsx
// nodes/MyNewNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { MyIcon } from 'lucide-react';

export function MyNewNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-yellow-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center">
        <MyIcon className="h-4 w-4 mr-2 text-yellow-400" />
        <div className="text-sm font-semibold" style={{ color: 'white' }}>
          {data.config?.name || 'My New Node'}
        </div>
      </div>
    </div>
  );
}
```

### 2. Crear el Componente de Settings
```tsx
// settings/MyNewNodeSettings.tsx
import React from 'react';
import { NodeConfigProps } from '../types';

export function MyNewNodeSettings({ config, onChange }: NodeConfigProps) {
  return (
    <div className="space-y-4">
      {/* Tu configuración aquí */}
    </div>
  );
}
```

### 3. Registrar el Nodo

**En `nodes/index.ts`:**
```tsx
import { MyNewNode } from './MyNewNode';

export const nodeTypes = {
  // ... otros nodos
  myNewNode: MyNewNode,
};
```

**En `types/nodeTypes.ts`:**
```tsx
export const NODE_TYPES: NodeType[] = [
  // ... otros nodos
  { 
    type: 'myNewNode', 
    label: 'My New Node', 
    icon: MyIcon, 
    description: 'Description of my new node' 
  },
];
```

### 4. Agregar al Panel de Settings
**En `panels/NodeSettings.tsx`:**
```tsx
{node.type === 'myNewNode' && (
  <MyNewNodeSettings config={config} onChange={setConfig} />
)}
```

## 🔧 Ventajas de esta Arquitectura

✅ **Modular**: Cada nodo es independiente
✅ **Escalable**: Fácil agregar nuevos nodos
✅ **Mantenible**: Código organizado por funcionalidad  
✅ **Reutilizable**: Componentes pueden usarse en otros lugares
✅ **Tipado**: TypeScript con tipos bien definidos
✅ **Testeable**: Cada componente se puede testear por separado

## 🎯 Próximos Pasos

1. **Migrar FlowBuilder.tsx**: Renombrar el archivo original
2. **Agregar Tests**: Unit tests para cada componente
3. **Documentar APIs**: JSDoc para cada función
4. **Optimizar**: React.memo para componentes pesados
5. **Validación**: Schema validation para configuraciones

## 📝 Uso

```tsx
import { FlowBuilder } from '@/components/conex';

function MyFlowPage() {
  return (
    <FlowBuilder
      onSave={(flowData) => console.log(flowData)}
      initialFlowData={undefined}
      loading={false}
    />
  );
}
```



 Actualización Completa de la Documentación:

  🆕 Nuevas Secciones Agregadas:

  🧪 Sistema de Testing Avanzado

  - Modal de configuración con presets de datos
  - 3 tipos de testing: Completos, Vacíos, Objeto vacío
  - Vista previa JSON en tiempo real
  - Logs detallados de ejecución

  🚀 Características del FlowBuilder

  - Herramientas de desarrollo (Ver JSON, Probar Flujo)
  - Interfaz mejorada con modales de ayuda
  - Controles integrados y tema oscuro

  ⚙️ Motor de Ejecución (FlowExecutor)

  - Arquitectura completa del ejecutor
  - Sistema de variables con Handlebars
  - Orden de ejecución topológico automático
  - Contexto de ejecución detallado

  📚 Contenido Mejorado:

  🧩 Anatomía de un Nodo (4 Componentes)

  1. Componente Visual - Con NodeHelpModal
  2. Configuración - Defaults y tipos
  3. Lógica de Ejecución - Con logs detallados
  4. Modal de Ayuda - Sistema completo

  🔍 Nodos Explicados en Detalle

  - Trigger Node - Datos del lead y variables
  - API Call Node - HTTP requests con interpolación
  - PandaDoc Node - Generación de documentos
  - Data Transform - Mapeo y transformación
  - Monitor Node - El "monito" de debugging

  🛠️ Guía Completa para Crear Nodos

  - Ejemplo completo de Email Node
  - 5 pasos detallados con código
  - Mejores prácticas y patrones
  - Panel de configuración opcional

  🎯 Funcionalidades Documentadas:

  🔄 Sistema de Variables

  - Estructura completa del contexto
  - Sintaxis de interpolación con ejemplos
  - IDs de nodos y cómo encontrarlos
  - Variables anidadas y notación de puntos

  🐛 Debugging y Troubleshooting

  - 4 herramientas principales disponibles
  - Problemas comunes con soluciones
  - Códigos de error explicados
  - Tips de debugging prácticos

  🚀 Ideas para Nuevos Nodos

  - Email Node - Ejemplo completo implementado
  - SMS, Webhook, Database - Configuraciones sugeridas
  - AI Node - Integración con OpenAI
  - Delay y Conditional - Nodos avanzados

  📊 Información Técnica:

  📁 Estructura de Archivos

  - Arquitectura modular actual
  - Ubicación de componentes y tipos
  - Referencias de dependencias principales

  🌐 APIs y Endpoints

  - Rutas de backend disponibles
  - Colecciones de Firestore utilizadas
  - Flujo de datos completo

  🎉 Resultado Final:

  La documentación ahora es completa y actualizada,
  incluyendo:

  - ✅ Sistema de testing con modal y presets
  - ✅ Ejecución real de flujos con FlowExecutor
  - ✅ Modales de ayuda en español
  - ✅ Logs detallados y debugging
  - ✅ Arquitectura modular explicada
  - ✅ Guías paso a paso para crear nodos
  - ✅ Referencias técnicas completas
