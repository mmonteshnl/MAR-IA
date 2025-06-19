# ApiCallNode

Nodo para realizar llamadas HTTP a APIs externas o internas. Soporta diferentes métodos HTTP, autenticación y configuración avanzada.

## Características

- ✅ Métodos HTTP: GET, POST, PUT, DELETE, PATCH
- ✅ Headers personalizables
- ✅ Body JSON con variables dinámicas
- ✅ Autenticación: Bearer Token, Basic Auth, API Key
- ✅ Timeouts y reintentos configurables
- ✅ Reemplazo de variables en URL y body

## Configuración

### Básica
- **Nombre**: Nombre descriptivo del nodo
- **Método**: Método HTTP a utilizar
- **URL**: Endpoint de la API
- **Timeout**: Tiempo límite en milisegundos
- **Reintentos**: Número de reintentos en caso de fallo

### Headers
Configura headers HTTP personalizados. Algunos comunes:
- `Content-Type: application/json`
- `Accept: application/json`
- `User-Agent: MyApp/1.0`

### Body
Para métodos POST, PUT, PATCH. Soporta:
- JSON válido
- Variables dinámicas: `{{trigger.input.campo}}`
- Texto plano

### Autenticación
- **None**: Sin autenticación
- **Bearer Token**: Agrega header `Authorization: Bearer <token>`
- **Basic Auth**: Codifica usuario:contraseña en Base64
- **API Key**: Header personalizado con clave

## Variables Dinámicas

Puedes usar variables en URL y body:
- `{{trigger.input.campo}}` - Datos del trigger
- `{{step_nodeId.response}}` - Respuesta de otro nodo
- `{{connections.api.token}}` - Variables de conexión

## Ejemplos

### GET Simple
```
URL: https://jsonplaceholder.typicode.com/users/{{trigger.input.userId}}
Método: GET
```

### POST con Autenticación
```
URL: https://api.ejemplo.com/usuarios
Método: POST
Headers: {
  "Content-Type": "application/json"
}
Body: {
  "nombre": "{{trigger.input.nombre}}",
  "email": "{{trigger.input.email}}"
}
Auth: Bearer Token
```

## Salida

El nodo retorna un objeto con:
- `success`: boolean - Si la petición fue exitosa
- `data`: any - Datos de respuesta
- `status`: number - Código de estado HTTP
- `headers`: object - Headers de respuesta
- `error`: string - Mensaje de error (si aplica)