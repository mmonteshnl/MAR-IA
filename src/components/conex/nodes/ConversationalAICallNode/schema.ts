// Schema de validación para el nodo ConversationalAICall
import { z } from 'zod';

export const conversationalAICallNodeSchema = z.object({
  // Identificador único del nodo
  name: z.string().min(1, 'Nombre del nodo requerido').default('Llamada IA Conversacional'),
  
  // Configuración de ElevenLabs
  agentId: z.string().min(1, 'Agent ID de ElevenLabs requerido'),
  voiceId: z.string().optional(),
  
  // Campo que contiene el número de teléfono en los datos de entrada
  phoneField: z.string().min(1, 'Campo de teléfono requerido').default('phone'),
  
  // Template de instrucciones para el agente IA (con handlebars)
  instructionsTemplate: z.string()
    .min(10, 'Template de instrucciones debe tener al menos 10 caracteres')
    .default(`Hola {{fullName}}, te llamo desde {{organizationName || 'nuestra empresa'}} porque has mostrado interés en nuestros servicios.

Me gustaría conocer más sobre tus necesidades y cómo podemos ayudarte.

Información del lead:
- Nombre: {{fullName}}
- Email: {{email}}
- Teléfono: {{phone}}
{{#if businessName}}- Empresa: {{businessName}}{{/if}}
{{#if source}}- Fuente: {{source}}{{/if}}

Por favor, mantén una conversación natural y profesional. Haz preguntas relevantes sobre sus necesidades y ofrece ayuda personalizada.`),
  
  // Configuración avanzada
  maxDuration: z.number().min(30).max(1800).default(600), // 10 minutos por defecto
  
  // Metadatos adicionales para la llamada
  metadata: z.record(z.any()).optional(),
  
  // Configuración de retry en caso de fallo
  retryOnFailure: z.boolean().default(false),
  maxRetries: z.number().min(0).max(3).default(1),
  
  // Configuración de seguimiento
  updateLeadStage: z.boolean().default(true),
  newStageOnSuccess: z.string().optional(),
  newStageOnFailure: z.string().optional(),
});

export type ConversationalAICallNodeConfig = z.infer<typeof conversationalAICallNodeSchema>;

// Schema para los datos del nodo (incluye configuración y metadatos)
export const conversationalAICallNodeDataSchema = z.object({
  config: conversationalAICallNodeSchema,
  meta: z.object({
    status: z.enum(['idle', 'loading', 'success', 'error']).optional(),
    lastExecution: z.string().optional(),
    lastCallId: z.string().optional(),
    lastResult: z.any().optional(),
    executionCount: z.number().default(0),
    lastError: z.string().optional(),
  }).optional(),
});

export type ConversationalAICallNodeData = z.infer<typeof conversationalAICallNodeDataSchema>;

// Valores por defecto para el nodo
export const CONVERSATIONAL_AI_CALL_DEFAULTS: ConversationalAICallNodeConfig = {
  name: 'Llamada IA Conversacional',
  agentId: process.env.ELEVENLABS_DEFAULT_AGENT_ID || '',
  voiceId: process.env.ELEVENLABS_DEFAULT_VOICE_ID || undefined,
  phoneField: 'phone',
  instructionsTemplate: `Hola {{fullName}}, te llamo desde {{organizationName || 'nuestra empresa'}} porque has mostrado interés en nuestros servicios.

Me gustaría conocer más sobre tus necesidades y cómo podemos ayudarte.

Información del lead:
- Nombre: {{fullName}}
- Email: {{email}}
- Teléfono: {{phone}}
{{#if businessName}}- Empresa: {{businessName}}{{/if}}
{{#if source}}- Fuente: {{source}}{{/if}}

Por favor, mantén una conversación natural y profesional. Haz preguntas relevantes sobre sus necesidades y ofrece ayuda personalizada.`,
  maxDuration: 600,
  retryOnFailure: false,
  maxRetries: 1,
  updateLeadStage: true,
};

// Tipos para el resultado de ejecución
export interface ConversationalAICallResult {
  success: boolean;
  callId?: string;
  status?: string;
  phoneNumber?: string;
  duration?: number;
  transcript?: string;
  error?: string;
  retryCount?: number;
}