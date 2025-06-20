// === COMMUNICATION HISTORY MANAGEMENT - SERVER ONLY ===
// Este archivo contiene funciones que solo deben ejecutarse en el servidor

import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import '@/lib/firebase-admin'; // Asegurar que Firebase Admin está inicializado

export interface CommunicationHistoryEntry {
  id: string;
  type: 'AI_CONVERSATIONAL_CALL' | 'WHATSAPP_MESSAGE' | 'EMAIL' | 'SMS' | 'MANUAL_CALL' | 'MEETING' | 'NOTE';
  provider?: string;
  status: string;
  timestamp: Date | any;
  phoneNumber?: string;
  duration?: number;
  transcript?: string;
  audioUrl?: string;
  content?: string;
  subject?: string;
  outcome?: string;
  externalId?: string;
  metadata?: Record<string, any>;
  createdAt: Date | any;
  createdBy?: string;
}

/**
 * Actualiza el historial de comunicación de un lead (SERVER ONLY)
 */
export async function updateLeadCommunicationHistory(
  leadId: string,
  entry: Omit<CommunicationHistoryEntry, 'id' | 'createdAt'>
): Promise<void> {
  if (!leadId) {
    throw new Error('leadId es requerido para actualizar historial de comunicación');
  }

  try {
    const db = getFirestore();
    const leadRef = db.collection('leads-unified').doc(leadId);
    
    // Generar ID único para la entrada
    const entryId = generateCommunicationId(entry.type, entry.externalId);
    
    // Preparar entrada con metadatos completos
    const communicationEntry: CommunicationHistoryEntry = {
      ...entry,
      id: entryId,
      createdAt: Timestamp.now(),
      timestamp: entry.timestamp instanceof Date ? 
        Timestamp.fromDate(entry.timestamp) : entry.timestamp,
    };

    console.log(`📝 Actualizando historial de comunicación para lead ${leadId}:`, {
      type: communicationEntry.type,
      provider: communicationEntry.provider,
      status: communicationEntry.status,
      hasTranscript: !!communicationEntry.transcript,
      duration: communicationEntry.duration,
    });

    // Actualizar documento del lead
    await leadRef.update({
      // Agregar al historial de comunicaciones
      communicationHistory: FieldValue.arrayUnion(communicationEntry),
      
      // Actualizar metadatos de última comunicación
      lastCommunication: communicationEntry.timestamp,
      lastCommunicationType: communicationEntry.type,
      lastCommunicationStatus: communicationEntry.status,
      
      // Actualizar timestamp de modificación
      updatedAt: Timestamp.now(),
      
      // Incrementar contador de comunicaciones
      communicationCount: FieldValue.increment(1),
    });

    console.log(`✅ Historial actualizado exitosamente para lead ${leadId}`);

    // Opcional: Trigger de eventos adicionales
    await triggerCommunicationEvents(leadId, communicationEntry);

  } catch (error) {
    console.error(`❌ Error actualizando historial de comunicación para lead ${leadId}:`, error);
    throw error;
  }
}

/**
 * Obtiene el historial de comunicación de un lead (SERVER ONLY)
 */
export async function getLeadCommunicationHistory(
  leadId: string,
  options?: {
    limit?: number;
    type?: string;
    provider?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<CommunicationHistoryEntry[]> {
  
  try {
    const db = getFirestore();
    const leadRef = db.collection('leads-unified').doc(leadId);
    const leadDoc = await leadRef.get();
    
    if (!leadDoc.exists) {
      throw new Error(`Lead ${leadId} no encontrado`);
    }
    
    const leadData = leadDoc.data();
    let history: CommunicationHistoryEntry[] = leadData?.communicationHistory || [];
    
    // Aplicar filtros si se especifican
    if (options) {
      if (options.type) {
        history = history.filter(entry => entry.type === options.type);
      }
      
      if (options.provider) {
        history = history.filter(entry => entry.provider === options.provider);
      }
      
      if (options.startDate) {
        history = history.filter(entry => {
          const entryDate = entry.timestamp instanceof Timestamp ? 
            entry.timestamp.toDate() : new Date(entry.timestamp);
          return entryDate >= options.startDate!;
        });
      }
      
      if (options.endDate) {
        history = history.filter(entry => {
          const entryDate = entry.timestamp instanceof Timestamp ? 
            entry.timestamp.toDate() : new Date(entry.timestamp);
          return entryDate <= options.endDate!;
        });
      }
    }
    
    // Ordenar por timestamp descendente (más recientes primero)
    history.sort((a, b) => {
      const dateA = a.timestamp instanceof Timestamp ? 
        a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
      const dateB = b.timestamp instanceof Timestamp ? 
        b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
    
    // Aplicar límite si se especifica
    if (options?.limit) {
      history = history.slice(0, options.limit);
    }
    
    return history;
    
  } catch (error) {
    console.error(`Error obteniendo historial de comunicación para lead ${leadId}:`, error);
    throw error;
  }
}

/**
 * Actualiza el estado de una comunicación específica (SERVER ONLY)
 */
export async function updateCommunicationStatus(
  leadId: string,
  communicationId: string,
  newStatus: string,
  additionalData?: Record<string, any>
): Promise<void> {
  
  try {
    const db = getFirestore();
    const leadRef = db.collection('leads-unified').doc(leadId);
    const leadDoc = await leadRef.get();
    
    if (!leadDoc.exists) {
      throw new Error(`Lead ${leadId} no encontrado`);
    }
    
    const leadData = leadDoc.data();
    const history: CommunicationHistoryEntry[] = leadData?.communicationHistory || [];
    
    // Encontrar y actualizar la comunicación específica
    const updatedHistory = history.map(entry => {
      if (entry.id === communicationId) {
        return {
          ...entry,
          status: newStatus,
          ...(additionalData && { metadata: { ...entry.metadata, ...additionalData } }),
          updatedAt: Timestamp.now(),
        };
      }
      return entry;
    });
    
    await leadRef.update({
      communicationHistory: updatedHistory,
      updatedAt: Timestamp.now(),
    });
    
    console.log(`✅ Estado de comunicación actualizado: ${communicationId} -> ${newStatus}`);
    
  } catch (error) {
    console.error('Error actualizando estado de comunicación:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de comunicación de un lead (SERVER ONLY)
 */
export async function getLeadCommunicationStats(leadId: string): Promise<{
  totalCommunications: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  byStatus: Record<string, number>;
  lastCommunication?: CommunicationHistoryEntry;
  averageCallDuration?: number;
}> {
  
  try {
    const history = await getLeadCommunicationHistory(leadId);
    
    const stats = {
      totalCommunications: history.length,
      byType: {} as Record<string, number>,
      byProvider: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      lastCommunication: history[0],
      averageCallDuration: 0,
    };
    
    let totalCallDuration = 0;
    let callCount = 0;
    
    history.forEach(entry => {
      // Contar por tipo
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      
      // Contar por provider
      if (entry.provider) {
        stats.byProvider[entry.provider] = (stats.byProvider[entry.provider] || 0) + 1;
      }
      
      // Contar por estado
      stats.byStatus[entry.status] = (stats.byStatus[entry.status] || 0) + 1;
      
      // Calcular duración promedio de llamadas
      if (entry.type.includes('CALL') && entry.duration) {
        totalCallDuration += entry.duration;
        callCount++;
      }
    });
    
    if (callCount > 0) {
      stats.averageCallDuration = totalCallDuration / callCount;
    }
    
    return stats;
    
  } catch (error) {
    console.error('Error obteniendo estadísticas de comunicación:', error);
    throw error;
  }
}

// Funciones auxiliares
function generateCommunicationId(type: string, externalId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  
  if (externalId) {
    return `${type.toLowerCase()}_${externalId}_${timestamp}`;
  }
  
  return `${type.toLowerCase()}_${timestamp}_${random}`;
}

async function triggerCommunicationEvents(
  leadId: string, 
  entry: CommunicationHistoryEntry
): Promise<void> {
  
  try {
    // Aquí puedes agregar lógica para triggers adicionales:
    // - Notificaciones push
    // - Webhooks a sistemas externos
    // - Actualización de scores de lead
    // - Triggers de automation flows
    
    console.log(`🔔 Triggering events para comunicación:`, {
      leadId,
      type: entry.type,
      status: entry.status,
    });
    
    // Ejemplo: Trigger automático para llamadas exitosas
    if (entry.type === 'AI_CONVERSATIONAL_CALL' && entry.status === 'completed') {
      // await triggerFollowUpFlow(leadId, entry);
    }
    
  } catch (error) {
    // No lanzar error para no afectar la operación principal
    console.error('Error en triggerCommunicationEvents:', error);
  }
}