# DataFetcherNode - Obtener Datos

## 📋 Descripción
El **DataFetcherNode** es un nodo especializado para obtener datos de la base de datos usando diferentes métodos: todos los registros, por ID específico o por rango con paginación. Permite configurar filtros, ordenamiento y opciones avanzadas de consulta.

## 🎯 Casos de Uso

### 📊 **Modo "Todos"**
Obtiene todos los registros de una colección
- **Ejemplo**: "Traer todos los leads activos"
- **Salida**: Array completo de registros

### 🔍 **Modo "Por ID"**
Busca un registro específico usando su ID
- **Ejemplo**: "Obtener el lead con ID lead-123"
- **Salida**: Registro específico o null

### 📄 **Modo "Por Rango"**
Obtiene registros con paginación y filtros
- **Ejemplo**: "Traer los últimos 20 leads premium ordenados por fecha"
- **Salida**: Array limitado con metadata de paginación

## ⚙️ Configuración

### 🔧 **Configuración Principal**
```typescript
{
  name: "Mi Data Fetcher",
  fetchMode: "all" | "byId" | "byRange",
  collection: "leads",
  enableLogging: true,
  timeout: 10000,
  includeMetadata: true
}
```

### 🔍 **Modos de Obtención**
- **all**: Obtiene todos los registros
- **byId**: Busca por ID específico
- **byRange**: Obtiene con límite y paginación

### 🎛️ **Opciones de Rango**
- **limit**: Número máximo de registros (1-1000)
- **offset**: Registros a saltar para paginación
- **sortBy**: Campo para ordenamiento
- **sortOrder**: 'asc' o 'desc'

## 📝 **Ejemplos de Configuración**

### 📊 **Ejemplo: Obtener Todos los Leads**
```javascript
{
  name: "Todos los Leads",
  fetchMode: "all",
  collection: "leads",
  enableLogging: true
}
```

### 🔍 **Ejemplo: Obtener Lead por ID**
```javascript
{
  name: "Lead Específico",
  fetchMode: "byId",
  collection: "leads",
  targetId: "{{leadId}}", // Variable dinámica
  idField: "id"
}
```

### 📄 **Ejemplo: Leads Recientes Paginados**
```javascript
{
  name: "Leads Recientes",
  fetchMode: "byRange",
  collection: "leads",
  rangeConfig: {
    limit: 20,
    offset: 0,
    sortBy: "createdAt",
    sortOrder: "desc"
  }
}
```

### 💎 **Ejemplo: Leads Premium con Filtros**
```javascript
{
  name: "Leads Premium",
  fetchMode: "byRange",
  collection: "leads",
  filters: {
    context: "premium",
    leadValue: { "$gt": 5000 }
  },
  rangeConfig: {
    limit: 50,
    sortBy: "leadValue",
    sortOrder: "desc"
  }
}
```

## 📊 **Respuesta del Nodo**

### ✅ **Respuesta Exitosa**
```javascript
{
  success: true,
  data: [
    {
      id: "lead-123",
      name: "Juan Pérez",
      email: "juan@empresa.com",
      context: "premium",
      leadValue: 15000
    }
    // ... más registros
  ],
  count: 25,
  metadata: {
    collection: "leads",
    fetchMode: "byRange",
    executionTime: 145,
    totalResults: 250,
    filters: { context: "premium" }
  },
  timestamp: "2025-06-19T19:30:00.000Z"
}
```

### ❌ **Respuesta de Error**
```javascript
{
  success: false,
  error: "Colección 'leads' no encontrada",
  timestamp: "2025-06-19T19:30:00.000Z"
}
```

## 🔧 **Integración en Flujos**

### 📡 **Variables de Entrada**
El nodo puede recibir:
1. `input.id` - ID para modo byId
2. `input.filters` - Filtros adicionales
3. Variables dinámicas `{{variable}}` en configuración

### 📤 **Variables de Salida**
- **data**: Array de registros obtenidos
- **count**: Número de registros en la respuesta
- **metadata**: Información de la consulta (opcional)

### 🔗 **Conexiones**
- **Entrada**: Parámetros de búsqueda o filtros
- **Salida**: Datos obtenidos para procesamiento posterior

## 🛠️ **Desarrollo y Testing**

### 🧪 **Ejemplo de Testing**
```javascript
import { runDataFetcherNode, createMockDatabaseManager } from './runner';

const mockData = {
  leads: [
    { id: "lead-1", name: "Lead 1", context: "premium" },
    { id: "lead-2", name: "Lead 2", context: "standard" }
  ]
};

const dbManager = createMockDatabaseManager(mockData);

const config = {
  name: "Test Fetcher",
  fetchMode: "byRange",
  collection: "leads",
  rangeConfig: { limit: 10 }
};

const context = {
  variables: {},
  input: { filters: { context: "premium" } }
};

const result = await runDataFetcherNode(config, context, dbManager);
console.log(result.data); // Array de leads premium
```

### 🔍 **Variables Dinámicas**
```javascript
// Configuración con variables
{
  targetId: "{{leadId}}", // Se resuelve desde context.variables.leadId
  filters: {
    userId: "{{currentUser.id}}" // Valores anidados
  }
}
```

## 🚀 **Integración con Base de Datos**

### 📚 **Interface DatabaseManager**
```typescript
interface DatabaseManager {
  getAll(collection: string, filters?: Record<string, any>): Promise<any[]>;
  getById(collection: string, id: string, idField?: string): Promise<any | null>;
  getByRange(collection: string, options: RangeOptions): Promise<{data: any[], total: number}>;
}
```

### 🔌 **Implementación Real**
El nodo incluye un mock para testing, pero debe conectarse con tu DatabaseManager real:

```javascript
// En tu FlowExecutor
const databaseManager = new YourDatabaseManager();
const result = await runDataFetcherNode(config, context, databaseManager);
```

## ⚠️ **Consideraciones**

- **Performance**: Usa modo "byRange" para datasets grandes
- **Filtros**: Los filtros dinámicos se combinan con los estáticos
- **Timeout**: Ajusta según el tamaño esperado de datos
- **Memoria**: El modo "all" puede consumir mucha memoria en datasets grandes
- **Índices**: Asegúrate de tener índices en campos de ordenamiento y filtrado

## 🎯 **Beneficios**

✅ **Flexibilidad**: Tres modos para diferentes necesidades  
✅ **Paginación**: Soporte nativo para datasets grandes  
✅ **Filtros**: Sistema de filtrado potente y flexible  
✅ **Variables**: Soporte para valores dinámicos  
✅ **Metadata**: Información detallada de consultas  
✅ **Performance**: Opciones de optimización y timeout  

---

*Este nodo está diseñado para ser la puerta de entrada principal a tus datos, ofreciendo flexibilidad y rendimiento para cualquier caso de uso.*