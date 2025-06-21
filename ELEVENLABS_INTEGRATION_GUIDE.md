# Guía de Integración de Llamadas con IA usando Plantillas CONEX

Este documento describe cómo utilizar las plantillas predefinidas en el CRM Mar-IA para integrar un flujo completo de llamadas automáticas con ElevenLabs.

## Arquitectura de la Integración

El proceso se ha dividido en dos flujos independientes y reutilizables:

1. **Flujo 1: Iniciar Llamada IA a Lead (Saliente):** Se encarga de tomar los datos de un lead, generar un guion y ordenar a ElevenLabs que realice la llamada.
2. **Flujo 2: Procesar Resultado de Llamada IA (Entrante):** Actúa como un webhook que recibe los resultados de la llamada desde ElevenLabs, los procesa y actualiza el CRM.

Esta separación permite la máxima flexibilidad.

## Flujo 1: Cómo Iniciar una Llamada Automática

Para disparar una llamada a un lead, solo necesitas ejecutar el flujo "Iniciar Llamada IA a Lead".

### Método de Ejecución

Realiza una petición `POST` al endpoint de ejecución de flujos de CONEX:

`POST /api/flows/run/{flowId}`

O, preferiblemente, usando su alias estable:

`POST /api/flows/dev-execute`

### Body de la Petición

```json
{
  "flowAlias": "iniciar-llamada-ia-a-lead", // O el ID del flujo guardado desde la plantilla
  "inputData": {
    "id": "lead_firestore_id_123",
    "fullName": "Restaurante La Delicia",
    "phone": "+15551234567",
    "businessType": "Restaurante",
    "organizationId": "org_abc_123"
    // ... cualquier otro dato del lead que sea útil para el guion
  }
}
```

### ¿Qué hace esta plantilla?

1. **Recibe los datos del lead** que le pasas en `inputData`.
2. **Usa un nodo de transformación de datos** para generar un guion dinámico y personalizado.
3. **Llama a la API de ElevenLabs** (conversationalAICall) y le ordena iniciar la llamada.
4. **Configura el Webhook:** Le dice a ElevenLabs que cuando la llamada termine, debe enviar los resultados al flujo "Procesar Resultado de Llamada IA". La URL del webhook está preconfigurada en la plantilla para apuntar a la API de ejecución del segundo flujo.

## Flujo 2: Cómo Recibir los Resultados

No necesitas llamar a este flujo directamente. ElevenLabs lo hará por ti.

El `webhook_url` configurado en la plantilla "Iniciar Llamada" apunta a la API que ejecuta este segundo flujo.

### ¿Qué hace esta plantilla?

1. **Recibe los datos de la llamada finalizada** desde ElevenLabs (estado, duración, transcripción, y los metadatos que enviamos originalmente).
2. **Guarda la transcripción completa** y el resultado en el historial de comunicaciones del lead correspondiente en Firestore.
3. **Usa un nodo de lógica** (logicGate) para analizar si en la transcripción se mencionó la palabra "demo" o "agendado".
4. **Envía una notificación por email** al equipo de ventas con un resultado diferente dependiendo de si se logró el objetivo o no.

## Pasos para la Integración

### 1. Obtén el ID o Alias
Desde la interfaz de Mar-IA, guarda las dos plantillas como flujos activos y obtén sus IDs o define alias estables para ellos.

### 2. Configura las Conexiones
Asegúrate de que en la sección de "Conexiones" de Mar-IA estén guardadas las API Keys válidas para:
- `elevenlabs`
- `resend`

### 3. Configura las Variables de las Plantillas

#### Para "Iniciar Llamada IA a Lead":
- `agentId`: Tu Agent ID de ElevenLabs
- `voiceId`: ID de la voz (opcional)
- `companyName`: Nombre de tu empresa
- `webhookBaseUrl`: URL base de tu CRM (ej: https://tu-crm.com)

#### Para "Procesar Resultado de Llamada IA":
- `teamEmails`: Email del equipo de ventas
- `notificationFrom`: Email del remitente de notificaciones

### 4. Dispara el Flujo 1
Desde tu sistema externo, realiza la llamada POST al endpoint de ejecución del primer flujo cada vez que quieras iniciar una llamada a un lead.

### 5. Verifica los Resultados
Monitoriza el historial del lead en el CRM de Mar-IA. Debería actualizarse automáticamente unos segundos después de que la llamada finalice.

## Ejemplos de Uso

### Ejemplo 1: Llamada de Bienvenida a Nuevo Lead
```json
{
  "flowAlias": "iniciar-llamada-ia-a-lead",
  "inputData": {
    "id": "lead_123",
    "fullName": "María González",
    "phone": "+5215551234567",
    "businessType": "Restaurante",
    "organizationId": "org_456",
    "source": "website_form",
    "interestArea": "sistema_de_reservas"
  }
}
```

### Ejemplo 2: Llamada de Seguimiento
```json
{
  "flowAlias": "iniciar-llamada-ia-a-lead",
  "inputData": {
    "id": "lead_789",
    "fullName": "Carlos Rodríguez",
    "phone": "+5215559876543",
    "businessType": "Consultorio Médico",
    "organizationId": "org_456",
    "lastContact": "2024-01-15",
    "stage": "interested"
  }
}
```

## Estructura de Datos del Webhook (Flujo 2)

Cuando ElevenLabs envía los resultados al segundo flujo, los datos tienen esta estructura:

```json
{
  "status": "completed",
  "duration_seconds": 180,
  "transcript": "Hola María, gracias por la llamada...",
  "outcome": "appointment_scheduled",
  "confidence": 0.95,
  "metadata": {
    "crm_lead_id": "lead_123",
    "crm_organization_id": "org_456",
    "lead_name": "María González",
    "business_type": "Restaurante"
  }
}
```

## Personalización Avanzada

### Modificar el Guion de Llamada
Edita el nodo "Generar Guion de Llamada" en la plantilla para personalizar:
- El saludo inicial
- La información de la empresa
- Las preguntas de calificación
- Los objetivos de la llamada

### Agregar Lógica de Negocio
Puedes agregar nodos adicionales para:
- Validar horarios de llamada
- Aplicar reglas de prioridad
- Integrar con calendarios
- Enviar follow-ups automáticos

### Integrar con Otros Sistemas
Los flujos pueden conectarse con:
- CRM externos (Salesforce, HubSpot)
- Calendarios (Google Calendar, Calendly)
- Sistemas de ticketing
- Herramientas de análisis

## Monitoreo y Análisis

### Métricas Importantes
- Tasa de respuesta de llamadas
- Duración promedio de llamadas
- Tasa de conversión a demo/cita
- Análisis de sentimientos de transcripciones

### Logs y Debugging
Cada nodo en los flujos genera logs detallados que puedes revisar en:
- Panel de ejecuciones de CONEX
- Logs del sistema
- Historial de comunicaciones del lead

## Solución de Problemas

### Problema: Las llamadas no se inician
**Solución:** 
- Verifica que el Agent ID de ElevenLabs sea válido
- Confirma que el número de teléfono esté en formato internacional
- Revisa las credenciales de conexión

### Problema: El webhook no recibe respuestas
**Solución:**
- Verifica la configuración de `NEXT_PUBLIC_BASE_URL` en variables de entorno
- Confirma que el segundo flujo esté activo y publicado
- Revisa que la URL del webhook sea correcta

### Problema: Las plantillas no se renderizan correctamente
**Solución:**
- Verifica la sintaxis de variables `{{variable}}`
- Confirma que las variables existan en los datos del lead
- Revisa los logs de transformación de datos

## Escalabilidad

Esta arquitectura modular te permite:
- **Escalar horizontalmente:** Agregar más agentes de IA
- **Personalizar por industria:** Diferentes guiones para diferentes tipos de negocio
- **A/B Testing:** Probar diferentes enfoques de llamada
- **Automatización completa:** Desde lead generation hasta cierre de ventas

## Conclusión

Esta arquitectura modular te permite iniciar una tarea compleja con una sola llamada a la API y recibir los resultados de forma estructurada y automatizada. Las plantillas CONEX simplifican enormemente la implementación y permiten reutilización en múltiples contextos.

Para soporte técnico o preguntas adicionales, consulta la documentación de CONEX o contacta al equipo de desarrollo.