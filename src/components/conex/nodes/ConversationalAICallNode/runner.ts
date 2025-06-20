// Ejecutor para el nodo ConversationalAICall
import { getElevenLabsClient, ElevenLabsUtils } from '@/lib/elevenlabs-api';
import type { FlowNode, FlowExecutionContext } from '@/types/conex';
import type { ConversationalAICallResult } from './schema';

export async function runConversationalAICallNode(
  node: FlowNode,
  context: FlowExecutionContext
): Promise<ConversationalAICallResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Iniciando ejecución del nodo ConversationalAICall:', node.id);
    
    // Validar configuración
    const configValidation = ElevenLabsUtils.validateConfig();
    if (!configValidation.isValid) {
      throw new Error(`Configuración inválida: ${configValidation.errors.join(', ')}`);
    }
    
    // Obtener configuración del nodo
    const config = node.data.config;
    const {
      agentId,
      voiceId,
      phoneField,
      instructionsTemplate,
      maxDuration,
      metadata,
      retryOnFailure,
      maxRetries,
    } = config;
    
    // Validar configuración del nodo
    if (!agentId) {
      throw new Error('Agent ID de ElevenLabs no configurado');
    }
    
    if (!instructionsTemplate) {
      throw new Error('Template de instrucciones no configurado');
    }
    
    // Obtener datos del lead del contexto
    const leadData = context.variables.trigger?.input || {};
    console.log('📋 Datos del lead disponibles:', Object.keys(leadData));
    
    // Obtener número de teléfono
    const phoneNumber = leadData[phoneField];
    if (!phoneNumber) {
      throw new Error(`Campo de teléfono '${phoneField}' no encontrado en datos del lead`);
    }
    
    // Validar número de teléfono
    if (!ElevenLabsUtils.isValidPhoneNumber(phoneNumber)) {
      throw new Error(`Número de teléfono inválido: ${phoneNumber}`);
    }
    
    // Renderizar instrucciones con datos del lead
    const instructions = context.renderTemplate(instructionsTemplate, {
      ...leadData,
      // Agregar datos adicionales del contexto
      organizationName: context.variables.organization?.name || 'Nuestra Empresa',
      flowName: context.flowName,
      executionId: context.executionId,
    });
    
    console.log('📝 Instrucciones renderizadas (primeros 100 caracteres):', 
      instructions.substring(0, 100) + '...');
    
    // Generar URL de webhook
    const webhookUrl = ElevenLabsUtils.generateWebhookUrl(
      process.env.NEXT_PUBLIC_BASE_URL!,
      leadData.id
    );
    
    console.log('🔗 Webhook URL generada:', webhookUrl);
    
    // Preparar metadatos
    const callMetadata = {
      ...metadata,
      leadId: leadData.id,
      organizationId: leadData.organizationId,
      flowExecutionId: context.executionId,
      nodeId: node.id,
      initiatedAt: new Date().toISOString(),
      phoneField,
      source: 'conex-flow',
    };
    
    // Inicializar cliente de ElevenLabs
    const elevenLabs = getElevenLabsClient();
    
    // Realizar la llamada
    console.log('📞 Iniciando llamada a:', ElevenLabsUtils.isValidPhoneNumber(phoneNumber) ? 
      phoneNumber.replace(/\d(?=\d{4})/g, '*') : 'número inválido');
    
    const callResponse = await elevenLabs.initiateCall({
      agentId,
      voiceId,
      phoneNumber,
      instructions,
      webhookUrl,
      maxDuration,
      metadata: callMetadata,
    });
    
    const executionTime = Date.now() - startTime;
    
    console.log('✅ Llamada iniciada exitosamente:', {
      callId: callResponse.call_id,
      status: callResponse.status,
      executionTime: `${executionTime}ms`,
    });
    
    // Retornar resultado exitoso
    return {
      success: true,
      callId: callResponse.call_id,
      status: callResponse.status,
      phoneNumber: phoneNumber,
    };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    console.error('❌ Error en nodo ConversationalAICall:', {
      nodeId: node.id,
      error: errorMessage,
      executionTime: `${executionTime}ms`,
    });
    
    // Determinar si se puede reintentar
    const canRetry = node.data.config.retryOnFailure && 
      (context.variables.retryCount || 0) < node.data.config.maxRetries;
    
    if (canRetry) {
      console.log('🔄 Marcando para reintento:', {
        currentRetries: context.variables.retryCount || 0,
        maxRetries: node.data.config.maxRetries,
      });
      
      // Incrementar contador de reintentos
      context.variables.retryCount = (context.variables.retryCount || 0) + 1;
      
      return {
        success: false,
        error: errorMessage,
        retryCount: context.variables.retryCount,
      };
    }
    
    // Retornar error final
    return {
      success: false,
      error: errorMessage,
      retryCount: context.variables.retryCount || 0,
    };
  }
}

// Función para validar la configuración del nodo antes de la ejecución
export function validateConversationalAICallNodeConfig(config: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!config.agentId) {
    errors.push('Agent ID de ElevenLabs es requerido');
  }
  
  if (!config.instructionsTemplate) {
    errors.push('Template de instrucciones es requerido');
  }
  
  if (!config.phoneField) {
    errors.push('Campo de teléfono es requerido');
  }
  
  if (config.maxDuration && (config.maxDuration < 30 || config.maxDuration > 1800)) {
    errors.push('Duración máxima debe estar entre 30 y 1800 segundos');
  }
  
  if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 3)) {
    errors.push('Máximo de reintentos debe estar entre 0 y 3');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Función para obtener el estado de una llamada (para debugging)
export async function getCallStatus(callId: string): Promise<any> {
  try {
    const elevenLabs = getElevenLabsClient();
    return await elevenLabs.getCallStatus(callId);
  } catch (error) {
    console.error('Error obteniendo estado de llamada:', error);
    throw error;
  }
}