// === LEAD PROMOTION API ===
// API para promocionar leads desde fuentes individuales al flujo principal

import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { leadUnifier } from '@/lib/lead-unifier';
import { mapMetaLeadToUnified, mapExtendedLeadToUnified } from '@/lib/lead-mappers';
import { validateCreateLeadInput } from '@/lib/lead-validators';
import { LeadStage, LeadSource } from '@/types/unified-lead';
import type { MetaLeadAdsModel } from '@/types/meta-lead-ads';
import type { ExtendedLead } from '@/types';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    return { error: 'Firebase Admin SDK not initialized', status: 500 };
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { error: 'No autorizado: Token faltante o inválido', status: 401 };
  }

  const token = authorizationHeader.split('Bearer ')[1];
  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    if (!decodedToken.uid) {
      return { error: 'No autorizado: UID no encontrado en el token', status: 401 };
    }
    return { uid: decodedToken.uid };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { error: 'No autorizado: Token inválido', status: 401 };
  }
}

// Helper function to get source collection name
function getSourceCollectionName(sourceType: string): string {
  switch (sourceType) {
    case 'meta-ads':
      return 'meta-lead-ads';
    case 'imported-csv':
      return 'leads-import'; // or whatever the imported CSV collection is called
    case 'google-places':
      return 'google-places-leads'; // or whatever the Google Places collection is called
    default:
      throw new Error(`Tipo de fuente no soportado: ${sourceType}`);
  }
}

// Helper function to check for duplicates by email or phone
async function checkForDuplicates(email?: string, phone?: string, organizationId?: string) {
  if (!email && !phone) {
    return null;
  }

  let query = firestoreDbAdmin
    .collection('leads-unified')
    .where('status', '!=', 'deleted');

  if (organizationId) {
    query = query.where('organizationId', '==', organizationId);
  }

  const duplicateQueries = [];
  
  if (email) {
    duplicateQueries.push(
      query.where('email', '==', email).get()
    );
  }
  
  if (phone) {
    duplicateQueries.push(
      query.where('phone', '==', phone).get()
    );
  }

  const results = await Promise.all(duplicateQueries);
  
  for (const snapshot of results) {
    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
  }
  
  return null;
}

// === POST: Promote lead from source to main flow ===
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.error 
      }, { status: authResult.status });
    }

    const body = await request.json();
    const { sourceLeadId, sourceType, organizationId } = body;

    // Validate required fields
    if (!sourceLeadId || !sourceType) {
      return NextResponse.json({ 
        success: false, 
        message: 'sourceLeadId y sourceType son requeridos' 
      }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'organizationId es requerido' 
      }, { status: 400 });
    }

    // Step 1: Get source data
    const sourceCollectionName = getSourceCollectionName(sourceType);
    const sourceDoc = await firestoreDbAdmin
      .collection(sourceCollectionName)
      .doc(sourceLeadId)
      .get();

    if (!sourceDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        message: 'Lead no encontrado en la fuente especificada' 
      }, { status: 404 });
    }

    const sourceData = { id: sourceDoc.id, ...sourceDoc.data() };

    // Step 2: Map source data to unified format
    let mappedLead;
    try {
      if (sourceType === 'meta-ads') {
        mappedLead = mapMetaLeadToUnified(sourceData as MetaLeadAdsModel & { 
          id: string; 
          uid: string; 
          organizationId: string; 
        });
      } else {
        // For other sources, treat as ExtendedLead format
        mappedLead = mapExtendedLeadToUnified(sourceData as ExtendedLead);
      }

      // Ensure stage is set to 'Nuevo' for promoted leads
      mappedLead.stage = LeadStage.NEW;
      mappedLead.organizationId = organizationId;
      mappedLead.uid = authResult.uid;

    } catch (error: any) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error mapeando datos del lead',
        error: error.message 
      }, { status: 400 });
    }

    // Step 3: Check for duplicates
    const existingLead = await checkForDuplicates(
      mappedLead.email, 
      mappedLead.phone, 
      organizationId
    );

    if (existingLead) {
      return NextResponse.json({ 
        success: false, 
        message: 'Este lead ya existe en el flujo de ventas.',
        conflict: true,
        existingLead: {
          id: existingLead.id,
          fullName: existingLead.fullName,
          email: existingLead.email,
          phone: existingLead.phone,
          stage: existingLead.stage
        }
      }, { status: 409 });
    }

    // Step 4: Validate unified lead data
    const validation = validateCreateLeadInput(mappedLead);
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Datos del lead inválidos',
        error: validation.error 
      }, { status: 400 });
    }

    // Step 5: Create unified lead
    const createResult = await leadUnifier.createLead(validation.data);
    if (!createResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error creando lead unificado',
        error: createResult.error 
      }, { status: 500 });
    }

    // Step 6: Mark source lead as promoted
    try {
      await firestoreDbAdmin
        .collection(sourceCollectionName)
        .doc(sourceLeadId)
        .update({
          isPromoted: true,
          promotedAt: new Date().toISOString(),
          promotedBy: authResult.uid,
          unifiedLeadId: createResult.data!.id
        });
    } catch (error: any) {
      console.error('Error marking source lead as promoted:', error);
      // Continue even if this fails - the main promotion succeeded
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead promocionado exitosamente al flujo de ventas',
      data: createResult.data,
      sourceLeadId,
      sourceType
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/leads/promote:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message 
    }, { status: 500 });
  }
}

// === GET: Check if lead can be promoted (duplicate check) ===
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.error 
      }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const sourceLeadId = searchParams.get('sourceLeadId');
    const sourceType = searchParams.get('sourceType');
    const organizationId = searchParams.get('organizationId');

    if (!sourceLeadId || !sourceType || !organizationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'sourceLeadId, sourceType y organizationId son requeridos' 
      }, { status: 400 });
    }

    // Get source data
    const sourceCollectionName = getSourceCollectionName(sourceType);
    const sourceDoc = await firestoreDbAdmin
      .collection(sourceCollectionName)
      .doc(sourceLeadId)
      .get();

    if (!sourceDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        message: 'Lead no encontrado en la fuente especificada' 
      }, { status: 404 });
    }

    const sourceData = sourceDoc.data();

    // Check for duplicates
    const existingLead = await checkForDuplicates(
      sourceData?.email, 
      sourceData?.phone || sourceData?.phoneNumber, 
      organizationId
    );

    return NextResponse.json({ 
      success: true, 
      canPromote: !existingLead,
      isAlreadyPromoted: sourceData?.isPromoted === true,
      duplicate: existingLead ? {
        id: existingLead.id,
        fullName: existingLead.fullName,
        email: existingLead.email,
        phone: existingLead.phone,
        stage: existingLead.stage
      } : null
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/leads/promote:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error verificando lead',
      error: error.message 
    }, { status: 500 });
  }
}