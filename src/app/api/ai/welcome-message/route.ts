import { NextRequest, NextResponse } from 'next/server';
import { generateWelcomeMessage, type WelcomeMessageInput } from '@/ai/flows/welcomeMessageFlow';
import { verifyAuthToken } from '@/lib/auth-utils';
import { admin, db } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // TODO: Temporarily disabled auth for testing
    // const authResult = await verifyAuthToken(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: authResult.error }, { status: 401 });
    // }

    const body: WelcomeMessageInput & { leadId?: string; organizationId?: string } = await request.json();
    
    console.log('Welcome message API called with:', body);
    
    if (!body.leadName) {
      return NextResponse.json(
        { error: 'leadName es requerido' },
        { status: 400 }
      );
    }

    let catalogUrl = body.catalogUrl;

    // Si tenemos leadId y organizationId, crear link de tracking automáticamente
    if (body.leadId && body.organizationId && !catalogUrl) {
      try {
        // Obtener información de la organización para el catálogo
        const db = admin.firestore();
        const orgDoc = await db.collection('organizations').doc(body.organizationId).get();
        const orgData = orgDoc.data();

        if (orgData?.catalogUrl) {
          // Generar link de tracking
          const trackingId = uuidv4();
          
          const trackingLink = {
            id: trackingId,
            leadId: body.leadId,
            organizationId: body.organizationId,
            type: 'catalogo',
            title: `Catálogo - ${body.leadName}`,
            destinationUrl: orgData.catalogUrl,
            campaignName: 'welcome_message',
            trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/track/${trackingId}`,
            createdAt: admin.firestore().FieldValue.serverTimestamp(),
            createdBy: 'system', // TODO: Fix when auth is re-enabled
            clickCount: 0,
            lastClickAt: null,
            isActive: true,
            metadata: {
              source: 'welcome_message',
              leadName: body.leadName,
              businessType: body.businessType || 'unknown'
            }
          };

          // Guardar el tracking link
          await db
            .collection('organizations')
            .doc(body.organizationId)
            .collection('tracking-links')
            .doc(trackingId)
            .set(trackingLink);

          catalogUrl = trackingLink.trackingUrl;
          console.log(`✅ Tracking link creado: ${trackingId} para lead: ${body.leadId}`);
        }
      } catch (error) {
        console.error('Error creando tracking link:', error);
        // Continuar sin tracking link si hay error
      }
    }

    // Preparar datos para el mensaje con información de empresa por defecto
    const messageInput = {
      ...body,
      companyName: body.companyName || 'nuestra empresa',
      companyDescription: body.companyDescription || 'nos especializamos en soluciones tecnológicas para impulsar tu negocio',
      catalogUrl
    };
    
    const result = await generateWelcomeMessage(messageInput);
    
    console.log('Welcome message API result:', result);
    
    return NextResponse.json({
      ...result,
      trackingUrl: catalogUrl // Incluir la URL de tracking en la respuesta
    });
  } catch (error) {
    console.error('Welcome message API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar mensaje';
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}