# Sistema de Testing de Flujos con HTTP

## Descripción
Sistema completo para probar y trabajar con flujos de manera real usando curl y fetch, directamente desde la interfaz de leads.

## Características Principales

### 🔧 Configuración Flexible
- **Selección de Flujo**: Escoge cualquier flujo manual habilitado
- **Método HTTP**: Soporte para GET y POST
- **Endpoint**: Usa ID o alias del flujo
- **Payload Personalizable**: Edita el JSON payload para POST

### 🌐 Ejemplos de Código Automáticos
- **cURL**: Comando completo listo para usar en terminal
- **JavaScript Fetch**: Código para usar en aplicaciones web
- **Copia Automática**: Un clic para copiar al portapapeles

### ⚡ Ejecución en Tiempo Real
- Ejecuta flujos directamente desde la interfaz
- Visualiza respuestas completas con formateo JSON
- Estados de error con detalles específicos

## Cómo Usar

### 1. Acceder al Testing
- Ve a la página de leads (`/leads`)
- Haz clic en el botón **"Testing HTTP"** (icono de terminal)

### 2. Configurar la Prueba
1. **Selecciona un flujo** del dropdown
2. **Elige el método HTTP**:
   - `GET`: Para consultar información del flujo
   - `POST`: Para ejecutar el flujo con datos
3. **Selecciona el endpoint**:
   - `Por Alias`: Usa el alias del flujo (más estable)
   - `Por ID`: Usa el ID interno del flujo

### 3. Personalizar Payload (POST)
Si seleccionas POST, puedes editar el payload JSON:
```json
{
  "leadData": {
    "id": "lead-123",
    "name": "Empresa Ejemplo",
    "phone": "+52 123 456 7890",
    "email": "contacto@ejemplo.com",
    "business": "Servicios",
    "stage": "Nuevo",
    "source": "Web",
    "description": "Cliente potencial interesado",
    "metadata": {}
  }
}
```

### 4. Generar Códigos de Ejemplo
El sistema genera automáticamente:

#### Comando cURL
```bash
curl -X POST "http://localhost:3047/api/flows/dev-execute/mi-flujo-alias" \
  -H "Content-Type: application/json" \
  -d '{"inputData": {"leadName": "Test Lead", "leadEmail": "test@example.com"}}'
```

#### JavaScript Fetch
```javascript
fetch('http://localhost:3047/api/flows/dev-execute/mi-flujo-alias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputData: {
      leadName: "Test Lead",
      leadEmail: "test@example.com"
    }
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### 5. Ejecutar y Ver Resultados
- Haz clic en **"Ejecutar Flujo"**
- Observa la respuesta completa con:
  - Estado HTTP
  - Datos de respuesta formatados
  - Timestamp de ejecución
  - Indicadores de éxito/error

## Endpoints Disponibles

### 1. Por Alias (Recomendado)
```
GET/POST /api/flows/dev-execute/{alias}
```
- Más estable para integraciones externas
- Independiente de cambios internos del flujo

### 2. Por ID
```
GET/POST /api/flows/dev-execute/{flowId}
```
- Acceso directo por ID interno
- Útil para desarrollo y debugging

## Casos de Uso

### 🔍 Desarrollo y Debugging
- Probar flujos antes de integrarlos en producción
- Verificar payloads y respuestas
- Debuggear errores específicos

### 🌐 Integraciones Externas
- Generar códigos para webhooks
- Configurar sistemas externos
- Documentar APIs para terceros

### 📊 Testing y QA
- Validar comportamiento de flujos
- Probar diferentes escenarios de datos
- Verificar respuestas del sistema

## Beneficios

✅ **Facilidad de Uso**: Interface gráfica intuitiva
✅ **Flexibilidad**: Soporte completo para GET y POST
✅ **Productividad**: Genera código automáticamente
✅ **Debugging**: Visualización completa de respuestas
✅ **Integración**: Fácil copy-paste para uso externo

## Acceso y Seguridad

### 🔓 **Acceso Libre (Sin Autenticación)**
Los endpoints de testing están diseñados para acceso libre:
- **Sin tokens requeridos** - Perfecto para integraciones externas
- **Sin validación de organización** - Acceso directo por ID o alias
- **Ideal para webhooks** - Terceros pueden ejecutar flujos directamente

### 🛡️ **Protección Implementada**
- Solo disponible en modo desarrollo
- Logs de auditoría completos de todas las ejecuciones
- Ejecución sandboxed sin acceso a datos sensibles
- Rate limiting automático por IP

### ⚠️ **Uso Responsable**
- Los endpoints públicos buscan flujos en todas las organizaciones
- Los flujos se ejecutan con datos simulados cuando no se proporcionan
- Todas las ejecuciones son registradas para auditoría

---

**Nota**: Los endpoints `/api/flows/dev-execute/{identifier}` funcionan sin autenticación para facilitar integraciones externas y testing.