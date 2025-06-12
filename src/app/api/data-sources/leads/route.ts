import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import type { Timestamp } from 'firebase-admin/firestore';
import { DataSource, DATA_SOURCE_CONFIG, type UnifiedLead } from '@/types/data-sources';

export async function POST(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
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
    const { organizationId, source } = await request.json();
    
    if (!organizationId || !source) {
      return NextResponse.json({ 
        message: 'organizationId y source son requeridos.' 
      }, { status: 400 });
    }

    console.log(`📋 Obteniendo leads de ${source} para organización:`, organizationId);

    const config = DATA_SOURCE_CONFIG[source as DataSource];
    if (!config) {
      return NextResponse.json({ 
        message: 'Fuente de datos no válida.' 
      }, { status: 400 });
    }

    // Obtener leads de la colección fuente
    const sourceQuery = firestoreDbAdmin
      .collection(config.collection)
      .where('organizationId', '==', organizationId)
      .orderBy('updatedAt', 'desc');
    
    const sourceSnapshot = await sourceQuery.get();
    console.log(`📊 Encontrados ${sourceSnapshot.size} leads en ${config.collection}`);

    // Obtener IDs de leads ya transferidos al flujo
    const flowQuery = firestoreDbAdmin
      .collection('leads-flow')
      .where('organizationId', '==', organizationId)
      .where('sourceCollection', '==', config.collection);
    
    const flowSnapshot = await flowQuery.get();
    const transferredIds = new Set(
      flowSnapshot.docs.map(doc => doc.data().sourceLeadId)
    );

    console.log(`✅ ${transferredIds.size} leads ya transferidos al flujo`);

    // Convertir a formato unificado
    const unifiedLeads: UnifiedLead[] = sourceSnapshot.docs.map(doc => {
      const data = doc.data();
      const isTransferred = transferredIds.has(doc.id);
      
      // Mapear campos comunes según la fuente
      let unifiedData: Partial<UnifiedLead> = {
        id: doc.id,
        source: source as DataSource,
        sourceId: doc.id,
        sourceData: data,
        organizationId,
        uid: data.uid || uid,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        transferredToFlow: isTransferred
      };

      // Mapear campos específicos según la fuente
      switch (source) {
        case DataSource.META_ADS:
          unifiedData.name = data.fullName || data.name || '';
          unifiedData.email = data.email || '';
          unifiedData.phone = data.phoneNumber || '';
          unifiedData.company = data.companyName || '';
          break;
          
        case DataSource.GOOGLE_PLACES:
          unifiedData.name = data.name || '';
          unifiedData.email = data.email || '';
          unifiedData.phone = data.phone || data.phoneNumber || '';
          unifiedData.company = data.businessName || data.name || '';
          break;
          
        case DataSource.XML_IMPORT:
        case DataSource.CSV_IMPORT:
          unifiedData.name = data.name || data.fullName || '';
          unifiedData.email = data.email || '';
          unifiedData.phone = data.phone || data.phoneNumber || '';
          unifiedData.company = data.company || data.companyName || '';
          break;
          
        case DataSource.MANUAL:
          unifiedData.name = data.name || '';
          unifiedData.email = data.email || '';
          unifiedData.phone = data.phone || '';
          unifiedData.company = data.company || '';
          break;
      }

      // Si está transferido, obtener información del lead en el flujo
      if (isTransferred) {
        const flowLead = flowSnapshot.docs.find(
          flowDoc => flowDoc.data().sourceLeadId === doc.id
        );
        if (flowLead) {
          unifiedData.flowLeadId = flowLead.id;
          unifiedData.transferredAt = flowLead.data().syncedAt || flowLead.data().createdAt?.toDate?.()?.toISOString();
        }
      }

      return unifiedData as UnifiedLead;
    });

    // Ordenar: no transferidos primero, luego por fecha de actualización
    unifiedLeads.sort((a, b) => {
      if (a.transferredToFlow !== b.transferredToFlow) {
        return a.transferredToFlow ? 1 : -1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    console.log(`🎯 Retornando ${unifiedLeads.length} leads unificados`);

    return NextResponse.json({ 
      leads: unifiedLeads,
      source,
      total: unifiedLeads.length,
      transferred: unifiedLeads.filter(lead => lead.transferredToFlow).length,
      available: unifiedLeads.filter(lead => !lead.transferredToFlow).length,
      metadata: {
        collection: config.collection,
        organizationId,
        generatedAt: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error obteniendo leads de fuente de datos:', error);
    return NextResponse.json({ 
      message: 'Error obteniendo leads de la fuente de datos.',
      error: error.message 
    }, { status: 500 });
  }
}