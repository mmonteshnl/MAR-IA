// Constantes para el nodo ConversationalAICall
import { CONVERSATIONAL_AI_CALL_DEFAULTS } from './schema';

export const CONVERSATIONAL_AI_CALL_NODE = {
  type: 'conversationalAICall',
  label: 'Llamada IA Conversacional',
  description: 'Realiza llamadas telefónicas automatizadas usando ElevenLabs Conversational AI',
  category: 'communication',
  inputs: ['trigger', 'data'],
  outputs: ['success', 'error', 'retry'],
  icon: '📞',
  color: '#10B981', // Verde esmeralda
  version: '1.0.0',
} as const;

export const HELP_CONTENT = {
  title: 'Llamada IA Conversacional',
  description: 'Este nodo realiza llamadas telefónicas automatizadas usando la tecnología de ElevenLabs Conversational AI 2.0.',
  
  features: [
    'Llamadas conversacionales naturales con IA',
    'Personalización de guiones con datos del lead',
    'Transcripción automática de llamadas',
    'Seguimiento de estado en tiempo real',
    'Integración con historial de comunicaciones',
    'Manejo de errores y reintentos',
  ],
  
  inputs: [
    {
      name: 'Trigger',
      description: 'Datos del lead que activó el flujo',
      required: true,
    },
    {
      name: 'Data',
      description: 'Datos adicionales para la llamada (opcional)',
      required: false,
    },
  ],
  
  outputs: [
    {
      name: 'Success',
      description: 'Llamada iniciada exitosamente',
    },
    {
      name: 'Error', 
      description: 'Error al iniciar la llamada',
    },
    {
      name: 'Retry',
      description: 'Llamada falló pero se puede reintentar',
    },
  ],
  
  configuration: [
    {
      field: 'agentId',
      description: 'ID del agente de ElevenLabs a utilizar',
      required: true,
    },
    {
      field: 'voiceId',
      description: 'ID de la voz (opcional, usa la voz por defecto del agente)',
      required: false,
    },
    {
      field: 'phoneField',
      description: 'Campo que contiene el número de teléfono en los datos del lead',
      default: 'phone',
    },
    {
      field: 'instructionsTemplate',
      description: 'Template de Handlebars con las instrucciones para el agente IA',
      required: true,
    },
    {
      field: 'maxDuration',
      description: 'Duración máxima de la llamada en segundos (30-1800)',
      default: 600,
    },
  ],
  
  usage: [
    'Configura tu Agent ID de ElevenLabs en el campo correspondiente',
    'Personaliza el template de instrucciones usando variables de Handlebars',
    'Conecta el nodo después de obtener datos del lead',
    'Las llamadas se procesarán automáticamente y los resultados se guardarán',
  ],
  
  examples: [
    {
      title: 'Llamada de seguimiento a nuevo lead',
      description: 'Configuración básica para contactar nuevos leads',
      config: {
        name: 'Llamada Inicial - Nuevo Lead',
        agentId: 'agent_abc123',
        phoneField: 'phone',
        instructionsTemplate: `Hola {{fullName}}, soy María, asistente virtual de {{organizationName}}. 

Te contacto porque has mostrado interés en nuestros servicios de {{serviceType || 'consultoría'}}.

Me gustaría conocer más sobre tu proyecto y cómo podemos ayudarte.

¿Tienes unos minutos para hablar?`,
        maxDuration: 300,
      },
    },
    {
      title: 'Llamada de calificación de lead',
      description: 'Para calificar leads y obtener más información',
      config: {
        name: 'Calificación de Lead',
        agentId: 'agent_xyz789',
        instructionsTemplate: `Hola {{fullName}}, te llamo para hacer un seguimiento de tu interés en {{serviceType}}.

Me gustaría hacer algunas preguntas para entender mejor tus necesidades:

1. ¿Cuál es tu principal desafío actual?
2. ¿Qué presupuesto has considerado?
3. ¿Cuándo te gustaría implementar una solución?

Información disponible:
- Empresa: {{businessName || 'No especificada'}}
- Email: {{email}}
- Fuente: {{source}}`,
        maxDuration: 600,
        updateLeadStage: true,
        newStageOnSuccess: 'qualified',
      },
    },
  ],
  
  tips: [
    'Usa variables de Handlebars como {{fullName}}, {{email}}, {{businessName}} en el template',
    'Mantén las instrucciones concisas pero informativas',
    'Configura duraciones apropiadas según el tipo de llamada',
    'Los resultados se guardan automáticamente en el historial del lead',
    'Puedes encadenar múltiples nodos basándose en el resultado de la llamada',
  ],
  
  troubleshooting: [
    {
      issue: 'Llamada no se inicia',
      solution: 'Verifica que el Agent ID sea válido y que el número de teléfono esté en formato correcto',
    },
    {
      issue: 'Template no se renderiza correctamente',
      solution: 'Verifica la sintaxis de Handlebars y que las variables existan en los datos del lead',
    },
    {
      issue: 'Webhook no recibe respuesta',
      solution: 'Verifica la configuración de NEXT_PUBLIC_BASE_URL en variables de entorno',
    },
  ],
};

export { CONVERSATIONAL_AI_CALL_DEFAULTS };