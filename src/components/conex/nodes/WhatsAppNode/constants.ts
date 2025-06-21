export const WHATSAPP_NODE_TYPE = 'whatsapp';

export const WHATSAPP_NODE_CONFIG = {
  type: WHATSAPP_NODE_TYPE,
  name: 'WhatsApp Message',
  description: 'Envía mensajes de WhatsApp a través de la API de Evolution',
  category: 'communication',
  version: '1.0.0',
  
  // Input/Output configuration
  inputs: {
    required: false,
    accepts: ['any'],
    description: 'Datos del lead o información para el mensaje'
  },
  
  outputs: {
    provides: ['messageResult'],
    description: 'Resultado del envío del mensaje'
  },

  // Default configuration
  defaultConfig: {
    instanceId: '',
    phoneNumber: '',
    message: 'Hola, este es un mensaje desde el flujo automatizado.',
    messageTemplate: 'Hola {{name}}, gracias por tu interés. Te contactamos desde {{company.name}}.',
    useTemplate: false,
    connectionStatus: 'unknown' as const,
    webhookPort: '8000',
    variables: {
      name: 'Cliente',
      company: 'Mi Empresa'
    }
  },

  // Configuration schema for validation
  schema: {
    type: 'object',
    required: ['instanceId'],
    properties: {
      instanceId: {
        type: 'string',
        title: 'Instance ID',
        description: 'ID de la instancia de WhatsApp configurada'
      },
      phoneNumber: {
        type: 'string',
        title: 'Phone Number',
        description: 'Número de teléfono destino (puede venir de datos de entrada)',
        pattern: '^\\+?[1-9]\\d{1,14}$'
      },
      message: {
        type: 'string',
        title: 'Message',
        description: 'Mensaje a enviar (modo directo)',
        maxLength: 4096
      },
      messageTemplate: {
        type: 'string',
        title: 'Message Template',
        description: 'Plantilla del mensaje con variables {{variable}}',
        maxLength: 4096
      },
      useTemplate: {
        type: 'boolean',
        title: 'Use Template',
        description: 'Usar plantilla con variables en lugar de mensaje directo'
      },
      webhookPort: {
        type: 'string',
        title: 'Webhook Port',
        description: 'Puerto donde escucha el webhook de WhatsApp'
      },
      variables: {
        type: 'object',
        title: 'Template Variables',
        description: 'Variables para reemplazar en la plantilla',
        additionalProperties: {
          type: 'string'
        }
      }
    }
  },

  // Available template variables
  availableVariables: [
    { key: 'name', description: 'Nombre del contacto' },
    { key: 'lead.name', description: 'Nombre del lead' },
    { key: 'lead.email', description: 'Email del lead' },
    { key: 'lead.phone', description: 'Teléfono del lead' },
    { key: 'lead.company', description: 'Empresa del lead' },
    { key: 'lead.industry', description: 'Industria del lead' },
    { key: 'lead.stage', description: 'Etapa del lead' },
    { key: 'lead.source', description: 'Fuente del lead' },
    { key: 'lead.value', description: 'Valor estimado del lead' },
    { key: 'company.name', description: 'Nombre de tu empresa' },
    { key: 'now', description: 'Fecha y hora actual' },
    { key: 'today', description: 'Fecha actual' },
    { key: 'time', description: 'Hora actual' }
  ],

  // Example configurations
  examples: {
    welcome: {
      name: 'Mensaje de Bienvenida',
      config: {
        useTemplate: true,
        messageTemplate: 'Hola {{lead.name}}, gracias por tu interés en {{company.name}}. Te contactaremos pronto.',
        variables: {
          'company.name': 'Mi Empresa'
        }
      }
    },
    followUp: {
      name: 'Seguimiento',
      config: {
        useTemplate: true,
        messageTemplate: 'Hola {{lead.name}}, queremos darte seguimiento a tu consulta del {{today}}. ¿Tienes alguna pregunta?',
        variables: {}
      }
    },
    appointment: {
      name: 'Confirmación de Cita',
      config: {
        useTemplate: true,
        messageTemplate: 'Hola {{lead.name}}, tu cita está confirmada para el {{appointmentDate}} a las {{appointmentTime}}. Te esperamos en {{company.name}}.',
        variables: {
          appointmentDate: 'mañana',
          appointmentTime: '10:00 AM',
          'company.name': 'Mi Empresa'
        }
      }
    }
  }
};

// Error messages
export const WHATSAPP_ERRORS = {
  NO_INSTANCE: 'No se ha configurado una instancia de WhatsApp',
  NO_PHONE: 'Número de teléfono requerido',
  NO_MESSAGE: 'Mensaje requerido',
  MESSAGE_TOO_LONG: 'El mensaje es demasiado largo (máximo 4096 caracteres)',
  INSTANCE_NOT_CONNECTED: 'La instancia de WhatsApp no está conectada',
  WEBHOOK_NOT_RESPONDING: 'El webhook de WhatsApp no responde',
  INVALID_PHONE: 'Formato de número de teléfono inválido',
  SEND_FAILED: 'Error al enviar el mensaje de WhatsApp',
  COOLDOWN_ACTIVE: 'El contacto está en periodo de cooldown'
};

// Status indicators
export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  UNKNOWN: 'unknown'
} as const;