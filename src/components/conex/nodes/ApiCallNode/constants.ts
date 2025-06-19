import { ApiCallNodeConfig } from './schema';

export const API_CALL_NODE_DEFAULTS: ApiCallNodeConfig = {
  name: 'Llamada API',
  method: 'GET',
  timeout: 10000,
  retries: 0,
};

export const HELP_CONTENT = {
  nodeType: 'apiCall',
  title: 'Nodo API Genérico',
  description: 'Realiza llamadas HTTP a cualquier API externa o interna. Ideal para integraciones con servicios web.',
  usage: [
    'Se conecta a APIs REST usando HTTP',
    'Soporta GET, POST, PUT, DELETE',
    'Permite configurar headers y autenticación',
    'Procesa respuestas JSON automáticamente',
    'Pasa datos al siguiente nodo en el flujo'
  ],
  examples: [
    `// Ejemplo: Consultar datos de un usuario
URL: https://jsonplaceholder.typicode.com/users/{{trigger.input.userId}}
Método: GET
Headers: {
  "Content-Type": "application/json"
}`,
    `// Ejemplo: Crear un nuevo registro
URL: https://api.miservicio.com/clientes
Método: POST
Body: {
  "nombre": "{{trigger.input.leadName}}",
  "email": "{{trigger.input.leadEmail}}"
}`
  ],
  tips: [
    'Usa variables dinámicas para URLs personalizadas',
    'Configura headers de autenticación según tu API',
    'Verifica el formato de respuesta esperado',
    'Usa el nodo Monitor después para debug'
  ]
};