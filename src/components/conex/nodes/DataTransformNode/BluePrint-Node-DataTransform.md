# DataTransformNode

Nodo para transformar y reestructurar datos JSON de nodos anteriores. Ideal para mapear, formatear y limpiar datos antes de pasarlos al siguiente nodo.

## Características

- ✅ Múltiples tipos de transformación
- ✅ Mapeo de campos con notación de puntos
- ✅ Templates de formato con variables
- ✅ Combinación de múltiples campos
- ✅ Extracción de datos anidados
- ✅ Preservación de datos originales (opcional)

## Tipos de Transformación

### 📋 Copiar
Copia el valor sin modificar del campo origen al destino.

### 🎨 Formatear
Aplica un template de formato usando variables:
```
Template: "{{response.firstName}} {{response.lastName}}"
Resultado: "Juan Pérez"
```

### 🗺️ Mapear
Convierte valores usando un diccionario de mapeo:
```json
{
  "active": "Activo",
  "inactive": "Inactivo",
  "pending": "Pendiente"
}
```

### 🔍 Extraer
Extrae un valor específico de un objeto anidado:
```
Origen: response.user
Ruta: profile.settings.theme
Resultado: valor de response.user.profile.settings.theme
```

### 🔗 Combinar
Combina múltiples campos en uno:
```
Campos: ["response.firstName", "response.lastName"]
Template: "{{combine.response.firstName}} {{combine.response.lastName}}"
```

## Configuración

### Básica
- **Nombre**: Nombre descriptivo del nodo
- **Objeto de Salida**: Nombre del objeto que contendrá los datos transformados
- **Preservar Originales**: Mantener datos originales además de los transformados

### Transformaciones
Cada transformación define:
- **Campo Origen**: Ruta del dato original (ej: `response.data.user.name`)
- **Campo Destino**: Nombre del campo en la salida (ej: `nombreUsuario`)
- **Tipo**: Tipo de transformación a aplicar
- **Configuración**: Parámetros específicos según el tipo

## Notación de Puntos

Usa la notación de puntos para acceder a datos anidados:
- `response.data` - Accede a data dentro de response
- `step_api-1.user.profile.name` - Accede a datos de otro nodo
- `trigger.input.leadEmail` - Accede a datos del trigger

## Ejemplos

### Transformación Básica
```json
{
  "transformations": [
    {
      "sourceField": "response.data.full_name",
      "targetField": "nombreCompleto",
      "transform": "copy"
    }
  ]
}
```

### Formateo de Nombre
```json
{
  "transformations": [
    {
      "sourceField": "response.first_name",
      "targetField": "nombreFormateado",
      "transform": "format",
      "formatTemplate": "Sr./Sra. {{response.first_name}} {{response.last_name}}"
    }
  ]
}
```

### Mapeo de Estados
```json
{
  "transformations": [
    {
      "sourceField": "response.status_code",
      "targetField": "estado",
      "transform": "map",
      "mapping": {
        "1": "Activo",
        "0": "Inactivo",
        "-1": "Suspendido"
      }
    }
  ]
}
```

## Salida

El nodo genera un objeto con la estructura:
```json
{
  "transformedData": {
    "campo1": "valor transformado",
    "campo2": "otro valor"
  }
}
```

Si `preserveOriginal` está habilitado:
```json
{
  "response": { /* datos originales */ },
  "transformedData": { /* datos transformados */ }
}
```