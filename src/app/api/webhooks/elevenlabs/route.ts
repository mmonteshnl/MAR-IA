// Webhook handler para ElevenLabs Conversational AI
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { updateLeadCommunicationHistory } from '@/lib/communication-history-server';

// Tipos para el payload de ElevenLabs
interface ElevenLabsWebhookPayload {
  call_id: string;
  status: 'initiated' | 'ringing' | 'answered' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'busy' | 'cancelled';
  phone_number: string;
  duration_seconds?: number;
  transcript?: string;
  audio_url?: string;
  started_at?: string;
  ended_at?: string;
  failure_reason?: string;
  metadata?: {
    leadId?: string;
    organizationId?: string;
    flowExecutionId?: string;
    nodeId?: string;
    initiatedAt?: string;
    source?: string;
    [key: string]: any;
  };
  agent_id: string;
  voice_id?: string;
}

// Mapa de estados para normalización
const STATUS_MAP = {
  'initiated': 'initiated',
  'ringing': 'ringing', 
  'answered': 'answered',
  'in_progress': 'in_progress',
  'completed': 'completed',
  'failed': 'failed',
  'no_answer': 'no_answer',
  'busy': 'busy',
  'cancelled': 'cancelled',
} as const;

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    console.log(`📞 [${requestId}] Webhook ElevenLabs recibido`);
    
    // Verificar headers de seguridad (si ElevenLabs los proporciona)
    const headersList = headers();
    const userAgent = headersList.get('user-agent');
    const contentType = headersList.get('content-type');
    
    console.log(`📞 [${requestId}] Headers:`, {
      userAgent: userAgent?.substring(0, 50),
      contentType,
    });

    // Parsear payload
    let payload: ElevenLabsWebhookPayload;
    try {
      payload = await req.json();
    } catch (error) {
      console.error(`❌ [${requestId}] Error parseando JSON:`, error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log(`📞 [${requestId}] Payload recibido:`, {
      callId: payload.call_id,
      status: payload.status,
      phoneNumber: maskPhoneNumber(payload.phone_number),
      duration: payload.duration_seconds,
      hasTranscript: !!payload.transcript,
      hasMetadata: !!payload.metadata,
      leadId: payload.metadata?.leadId,
    });

    // Validar payload básico
    if (!payload.call_id || !payload.status) {
      console.error(`❌ [${requestId}] Payload inválido - falta call_id o status`);
      return NextResponse.json(
        { error: 'Missing required fields: call_id, status' },
        { status: 400 }
      );
    }

    // Extraer leadId de metadata o query params
    const leadId = payload.metadata?.leadId || req.nextUrl.searchParams.get('leadId');
    
    if (!leadId) {
      console.error(`❌ [${requestId}] No se encontró leadId en metadata ni query params`);
      return NextResponse.json(
        { error: 'leadId is required in metadata or query params' },
        { status: 400 }
      );
    }

    // Procesar el webhook según el estado
    const result = await processCallWebhook(payload, leadId, requestId);
    
    if (result.success) {
      console.log(`✅ [${requestId}] Webhook procesado correctamente para lead ${leadId}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed successfully',
        requestId 
      });
    } else {
      console.error(`❌ [${requestId}] Error procesando webhook:`, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`❌ [${requestId}] Error crítico en webhook:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Función principal para procesar el webhook
async function processCallWebhook(
  payload: ElevenLabsWebhookPayload, 
  leadId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    // Normalizar estado
    const normalizedStatus = STATUS_MAP[payload.status] || payload.status;
    
    // Determinar si la llamada ha finalizado
    const isCompleted = ['completed', 'failed', 'no_answer', 'busy', 'cancelled'].includes(normalizedStatus);
    
    // Preparar datos para el historial de comunicación
    const communicationEntry = {
      type: 'AI_CONVERSATIONAL_CALL' as const,
      provider: 'ElevenLabs',
      status: normalizedStatus,
      timestamp: new Date(),
      externalId: payload.call_id,
      
      // Datos de la llamada
      phoneNumber: payload.phone_number,
      duration: payload.duration_seconds,
      transcript: payload.transcript,
      audioUrl: payload.audio_url,
      
      // Metadatos
      metadata: {
        ...payload.metadata,
        agentId: payload.agent_id,
        voiceId: payload.voice_id,
        startedAt: payload.started_at,
        endedAt: payload.ended_at,
        failureReason: payload.failure_reason,
        isCompleted,
        processedAt: new Date().toISOString(),
        requestId,
      },
    };

    console.log(`📞 [${requestId}] Actualizando historial para lead ${leadId}:`, {
      status: communicationEntry.status,
      duration: communicationEntry.duration,
      hasTranscript: !!communicationEntry.transcript,
      isCompleted,
    });

    // Actualizar historial de comunicación
    await updateLeadCommunicationHistory(leadId, communicationEntry);

    // Si la llamada ha finalizado, realizar acciones adicionales
    if (isCompleted) {
      await handleCallCompletion(payload, leadId, requestId);
    }

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [${requestId}] Error procesando webhook:`, error);
    return { success: false, error: errorMessage };
  }
}

// Manejar finalización de llamada
async function handleCallCompletion(
  payload: ElevenLabsWebhookPayload,
  leadId: string,
  requestId: string
): Promise<void> {
  
  try {
    console.log(`🏁 [${requestId}] Procesando finalización de llamada para lead ${leadId}`);

    // Determinar el resultado de la llamada
    const callResult = determineCallResult(payload);
    
    console.log(`📊 [${requestId}] Resultado de llamada:`, callResult);

    // Aquí puedes agregar lógica adicional según el resultado:
    
    // 1. Actualizar stage del lead
    if (payload.metadata?.updateLeadStage) {
      await updateLeadStageBasedOnResult(leadId, callResult, payload.metadata);
    }

    // 2. Enviar notificaciones
    await sendCallCompletionNotifications(leadId, callResult, payload);

    // 3. Continuar flujo de CONEX si es necesario
    if (payload.metadata?.flowExecutionId) {
      await continueFlowExecution(payload.metadata.flowExecutionId, callResult);
    }

    // 4. Crear tareas de seguimiento automático
    if (callResult.requiresFollowUp) {
      await createFollowUpTasks(leadId, callResult, payload);
    }

  } catch (error) {
    console.error(`❌ [${requestId}] Error en handleCallCompletion:`, error);
    // No lanzamos el error para no fallar el webhook
  }
}

// Determinar resultado de la llamada
function determineCallResult(payload: ElevenLabsWebhookPayload) {
  const status = payload.status;
  const duration = payload.duration_seconds || 0;
  const hasTranscript = !!payload.transcript;

  return {
    success: status === 'completed',
    connected: ['answered', 'in_progress', 'completed'].includes(status),
    duration,
    hasTranscript,
    status,
    requiresFollowUp: status === 'no_answer' || status === 'busy',
    failureReason: payload.failure_reason,
    quality: hasTranscript && duration > 30 ? 'good' : duration > 10 ? 'fair' : 'poor',
  };
}

// Actualizar stage del lead basado en resultado
async function updateLeadStageBasedOnResult(
  leadId: string,
  callResult: any,
  metadata: any
): Promise<void> {
  
  try {
    let newStage: string | undefined;

    if (callResult.success && metadata.newStageOnSuccess) {
      newStage = metadata.newStageOnSuccess;
    } else if (!callResult.connected && metadata.newStageOnFailure) {
      newStage = metadata.newStageOnFailure;
    }

    if (newStage) {
      // Aquí integrarías con tu sistema de actualización de leads
      console.log(`📈 Actualizando stage del lead ${leadId} a: ${newStage}`);
      // await updateLeadStage(leadId, newStage);
    }

  } catch (error) {
    console.error('Error actualizando stage del lead:', error);
  }
}

// Enviar notificaciones de finalización
async function sendCallCompletionNotifications(
  leadId: string,
  callResult: any,
  payload: ElevenLabsWebhookPayload
): Promise<void> {
  
  try {
    // Notificar a usuarios relevantes sobre el resultado de la llamada
    console.log(`📬 Enviando notificaciones para lead ${leadId}:`, {
      success: callResult.success,
      duration: callResult.duration,
      hasTranscript: callResult.hasTranscript,
    });
    
    // Aquí integrarías con tu sistema de notificaciones
    // await sendNotification(leadId, callResult);

  } catch (error) {
    console.error('Error enviando notificaciones:', error);
  }
}

// Continuar ejecución de flujo CONEX
async function continueFlowExecution(
  executionId: string,
  callResult: any
): Promise<void> {
  
  try {
    console.log(`🔄 Continuando flujo CONEX ${executionId} con resultado:`, callResult);
    
    // Aquí integrarías con el sistema CONEX para continuar el flujo
    // await continueFlow(executionId, callResult);

  } catch (error) {
    console.error('Error continuando flujo CONEX:', error);
  }
}

// Crear tareas de seguimiento
async function createFollowUpTasks(
  leadId: string,
  callResult: any,
  payload: ElevenLabsWebhookPayload
): Promise<void> {
  
  try {
    if (callResult.status === 'no_answer') {
      console.log(`📋 Creando tarea de seguimiento para lead ${leadId} - sin respuesta`);
      // await createTask(leadId, 'follow_up_no_answer', payload);
    } else if (callResult.status === 'busy') {
      console.log(`📋 Creando tarea de seguimiento para lead ${leadId} - ocupado`);
      // await createTask(leadId, 'follow_up_busy', payload);
    }

  } catch (error) {
    console.error('Error creando tareas de seguimiento:', error);
  }
}

// Funciones utilitarias
function generateRequestId(): string {
  return `elevenlabs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function maskPhoneNumber(phone: string): string {
  if (phone.length > 4) {
    return phone.slice(0, -4) + '****';
  }
  return '****';
}

// Endpoint GET para verificación de salud
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'elevenlabs-webhook',
    timestamp: new Date().toISOString(),
  });
}