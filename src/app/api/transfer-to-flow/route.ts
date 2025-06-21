import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import type { MetaLeadAdsModel } from '@/types/meta-lead-ads';
import type { LeadsFlowModel } from '@/types/leads-flow';
import { DEFAULT_FLOW_CONFIG } from '@/types/leads-flow';

export async function POST(request: NextRequest) {
  if (!firestoreDbAdmin || !authAdmin) {
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

  // Verificar autorización
  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return NextResponse.json({ 
      message: 'No autorizado: Token faltante o inválido.' 
    }, { status: 401 });
  }
  
  const token = authorizationHeader.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await authAdmin.verifyIdToken(token);
  } catch (error) {
    console.error('Error al verificar el token de ID de Firebase:', error);
    return NextResponse.json({ 
      message: 'No autorizado: Token inválido.' 
    }, { status: 401 });
  }

  const uid = decodedToken.uid;
  if (!uid) {
    return NextResponse.json({ 
      message: 'No autorizado: UID no encontrado en el token.' 
    }, { status: 401 });
  }

  try {
    const { organizationId, leadIds, sourceType } = await request.json();
    
    if (!organizationId) {
      return NextResponse.json({ 
        message: 'organizationId es requerido.' 
      }, { status: 400 });
    }

    console.log(`🔄 Transfiriendo leads a leads-flow para organización: ${organizationId}`);
    
    let transferredCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Si se especifican IDs específicos, transferir solo esos
    if (leadIds && Array.isArray(leadIds) && leadIds.length > 0) {
      console.log(`📋 Transfiriendo ${leadIds.length} leads específicos`);
      
      for (const leadId of leadIds) {
        try {
          const result = await transferSingleLead(leadId, uid, organizationId, sourceType);
          if (result.success) {
            transferredCount++;
          } else {
            skippedCount++;
          }
        } catch (error: any) {
          errorCount++;
          errors.push(`Lead ${leadId}: ${error.message}`);
        }
      }
    } else {
      // Transferir todos los leads de meta-lead-ads que no estén ya en leads-flow
      console.log('📋 Transfiriendo todos los leads de meta-lead-ads');
      
      const metaLeadsSnapshot = await firestoreDbAdmin
        .collection('meta-lead-ads')
        .where('organizationId', '==', organizationId)
        .get();

      console.log(`📊 Encontrados ${metaLeadsSnapshot.size} leads en meta-lead-ads`);

      for (const doc of metaLeadsSnapshot.docs) {
        try {
          const result = await transferSingleLead(doc.id, uid, organizationId);
          if (result.success) {
            transferredCount++;
          } else {
            skippedCount++;
          }
        } catch (error: any) {
          errorCount++;
          errors.push(`Lead ${doc.id}: ${error.message}`);
        }
      }
    }

    console.log(`✅ Transferencia completada: ${transferredCount} transferidos, ${skippedCount} omitidos, ${errorCount} errores`);

    return NextResponse.json({ 
      message: 'Transferencia completada',
      transferred: transferredCount,
      skipped: skippedCount,
      errors: errorCount,
      errorDetails: errors
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error durante la transferencia:', error);
    return NextResponse.json({ 
      message: 'Error durante la transferencia.',
      error: error.message 
    }, { status: 500 });
  }
}

async function transferSingleLead(
  leadId: string, 
  userId: string, 
  organizationId: string,
  sourceType?: string
): Promise<{ success: boolean; reason?: string }> {
  
  // Handle QR leads separately
  if (sourceType === 'qr-leads') {
    return await transferQRLead(leadId, userId, organizationId);
  }

  // Verificar si ya existe en leads-flow (for traditional leads)
  const existingFlowLead = await firestoreDbAdmin!
    .collection('leads-flow')
    .where('sourceLeadId', '==', leadId)
    .where('organizationId', '==', organizationId)
    .limit(1)
    .get();

  if (!existingFlowLead.empty) {
    console.log(`⏭️ Lead ${leadId} ya existe en leads-flow, omitiendo`);
    return { success: false, reason: 'already_exists' };
  }

  // Obtener el lead original de meta-lead-ads
  const metaLeadDoc = await firestoreDbAdmin!
    .collection('meta-lead-ads')
    .doc(leadId)
    .get();

  if (!metaLeadDoc.exists) {
    throw new Error(`Lead ${leadId} no encontrado en meta-lead-ads`);
  }

  const metaLeadData = metaLeadDoc.data() as MetaLeadAdsModel;
  
  // Crear el nuevo lead en leads-flow con propiedades de flujo
  const now = new Date().toISOString();
  const flowLead: Omit<LeadsFlowModel, 'id'> = {
    // Copiar todas las propiedades del meta-lead
    ...metaLeadData,
    
    // Agregar propiedades específicas del flujo
    ...DEFAULT_FLOW_CONFIG,
    
    // Metadatos de sincronización
    sourceLeadId: leadId,
    sourceCollection: 'meta-lead-ads',
    syncedAt: now,
    lastSyncedAt: now,
    
    // Configuración inicial del flujo
    currentStage: metaLeadData.stage || 'Nuevo',
    stageHistory: [{
      stage: metaLeadData.stage || 'Nuevo',
      enteredAt: now,
      triggeredBy: 'system',
      userId: userId,
      notes: 'Lead transferido desde Meta Ads'
    }],
    
    // Timestamps de Firebase
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  // Guardar en leads-flow
  await firestoreDbAdmin!.collection('leads-flow').add(flowLead);
  
  console.log(`✅ Lead ${leadId} transferido exitosamente a leads-flow`);
  return { success: true };
}

// GET endpoint para obtener estadísticas de transferencia
export async function GET(request: NextRequest) {
  if (!firestoreDbAdmin || !authAdmin) {
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return NextResponse.json({ 
      message: 'No autorizado: Token faltante o inválido.' 
    }, { status: 401 });
  }
  
  const token = authorizationHeader.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await authAdmin.verifyIdToken(token);
  } catch (error) {
    return NextResponse.json({ 
      message: 'No autorizado: Token inválido.' 
    }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ 
        message: 'organizationId es requerido.' 
      }, { status: 400 });
    }

    // Contar leads en meta-lead-ads
    const metaLeadsSnapshot = await firestoreDbAdmin
      .collection('meta-lead-ads')
      .where('organizationId', '==', organizationId)
      .get();

    // Contar leads en leads-flow
    const flowLeadsSnapshot = await firestoreDbAdmin
      .collection('leads-flow')
      .where('organizationId', '==', organizationId)
      .get();

    // Contar leads ya sincronizados
    const syncedLeadsSnapshot = await firestoreDbAdmin
      .collection('leads-flow')
      .where('organizationId', '==', organizationId)
      .where('sourceCollection', '==', 'meta-lead-ads')
      .get();

    return NextResponse.json({
      totalMetaLeads: metaLeadsSnapshot.size,
      totalFlowLeads: flowLeadsSnapshot.size,
      syncedFromMeta: syncedLeadsSnapshot.size,
      pendingTransfer: metaLeadsSnapshot.size - syncedLeadsSnapshot.size
    });

  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ 
      message: 'Error obteniendo estadísticas.',
      error: error.message 
    }, { status: 500 });
  }
}

async function transferQRLead(
  leadId: string,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; reason?: string }> {
  try {
    // For QR leads, the leadId format is "qrLinkId:leadId"
    const [qrLinkId, actualLeadId] = leadId.includes(':') ? leadId.split(':') : [leadId, leadId];
    
    // Find the QR lead in the organization's QR tracking links
    let qrLeadDoc;
    let qrLinkData;
    
    if (qrLinkId !== actualLeadId) {
      // We have a specific QR link ID
      qrLeadDoc = await firestoreDbAdmin!
        .collection('organizations')
        .doc(organizationId)
        .collection('qr-tracking-links')
        .doc(qrLinkId)
        .collection('publicLeads')
        .doc(actualLeadId)
        .get();
        
      if (qrLeadDoc.exists) {
        const qrLinkDocRef = await firestoreDbAdmin!
          .collection('organizations')
          .doc(organizationId)
          .collection('qr-tracking-links')
          .doc(qrLinkId)
          .get();
        qrLinkData = qrLinkDocRef.data();
      }
    } else {
      // Search through all QR links to find the lead
      const qrLinksSnapshot = await firestoreDbAdmin!
        .collection('organizations')
        .doc(organizationId)
        .collection('qr-tracking-links')
        .get();

      for (const qrLinkDoc of qrLinksSnapshot.docs) {
        const leadDoc = await firestoreDbAdmin!
          .collection('organizations')
          .doc(organizationId)
          .collection('qr-tracking-links')
          .doc(qrLinkDoc.id)
          .collection('publicLeads')
          .doc(actualLeadId)
          .get();

        if (leadDoc.exists) {
          qrLeadDoc = leadDoc;
          qrLinkData = qrLinkDoc.data();
          break;
        }
      }
    }

    if (!qrLeadDoc || !qrLeadDoc.exists) {
      throw new Error(`QR lead ${actualLeadId} not found`);
    }

    const leadData = qrLeadDoc.data();

    // Check if already promoted
    if (leadData?.status === 'promoted') {
      console.log(`⏭️ QR Lead ${actualLeadId} already promoted, skipping`);
      return { success: false, reason: 'already_promoted' };
    }

    // Create a new lead in the leads-flow collection
    const newLeadId = `qr_${actualLeadId}_${Date.now()}`;
    const now = new Date().toISOString();
    
    const flowLead = {
      // Basic lead information
      fullName: leadData?.leadData?.name || '',
      email: leadData?.leadData?.email || '',
      phoneNumber: leadData?.leadData?.phone || '',
      companyName: '',
      notes: leadData?.leadData?.notes || '',
      
      // Flow properties
      stage: 'Nuevo',
      status: 'active',
      priority: 'medium',
      organizationId,
      createdBy: userId,
      
      // Source tracking
      source: 'QR Code',
      sourceLeadId: actualLeadId,
      sourceCollection: 'qr-leads',
      syncedAt: now,
      lastSyncedAt: now,
      
      // QR-specific metadata
      qrLinkName: qrLinkData?.name,
      qrLinkId: qrLinkId !== actualLeadId ? qrLinkId : undefined,
      publicUrlId: qrLinkData?.publicUrlId,
      
      // Stage history
      currentStage: 'Nuevo',
      stageHistory: [{
        stage: 'Nuevo',
        enteredAt: now,
        triggeredBy: 'user',
        userId: userId,
        notes: 'Lead promocionado desde QR'
      }],
      
      // Timestamps
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    // Batch operation: create new lead and update original
    const batch = firestoreDbAdmin!.batch();

    // Add to leads-flow
    const newLeadRef = firestoreDbAdmin!.collection('leads-flow').doc(newLeadId);
    batch.set(newLeadRef, flowLead);

    // Update original QR lead status
    const originalLeadRef = firestoreDbAdmin!
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .doc(qrLinkId !== actualLeadId ? qrLinkId : qrLeadDoc.ref.parent.parent!.id)
      .collection('publicLeads')
      .doc(actualLeadId);

    batch.update(originalLeadRef, {
      status: 'promoted',
      'metadata.promotedAt': FieldValue.serverTimestamp(),
      'metadata.promotedBy': userId,
      'metadata.promotedToLeadId': newLeadId
    });

    await batch.commit();

    console.log(`✅ QR lead ${actualLeadId} promoted successfully to ${newLeadId}`);
    return { success: true };

  } catch (error: any) {
    console.error(`❌ Error promoting QR lead ${leadId}:`, error);
    throw error;
  }
}