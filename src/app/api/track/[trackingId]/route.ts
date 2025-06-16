import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

interface ClickData {
  timestamp: string;
  userAgent: string;
  referrer: string;
  screenResolution: string;
  language: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const { trackingId } = params;
    const clickData: ClickData = await request.json();

    if (!trackingId) {
      return NextResponse.json(
        { error: 'Tracking ID requerido' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    
    // Buscar el tracking link en todas las organizaciones
    const allOrgsSnapshot = await db.collection('organizations').get();
    let trackingLinkDoc = null;
    let organizationId = '';

    for (const orgDoc of allOrgsSnapshot.docs) {
      const trackingLinkRef = await orgDoc.ref
        .collection('tracking-links')
        .doc(trackingId)
        .get();

      if (trackingLinkRef.exists) {
        trackingLinkDoc = trackingLinkRef;
        organizationId = orgDoc.id;
        break;
      }
    }

    if (!trackingLinkDoc || !trackingLinkDoc.exists) {
      return NextResponse.json(
        { error: 'Enlace de tracking no encontrado' },
        { status: 404 }
      );
    }

    const trackingData = trackingLinkDoc.data();
    
    if (!trackingData || !trackingData.isActive) {
      return NextResponse.json(
        { error: 'Enlace de tracking inactivo' },
        { status: 410 }
      );
    }

    // Registrar el click
    const clickRecord = {
      trackingId,
      leadId: trackingData.leadId,
      organizationId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      clickData: {
        ...clickData,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   request.ip || 'unknown',
        country: request.headers.get('cf-ipcountry') || 'unknown'
      }
    };

    // Guardar el click en la colección de clicks
    await db
      .collection('organizations')
      .doc(organizationId)
      .collection('tracking-clicks')
      .add(clickRecord);

    // Actualizar el contador en el tracking link
    await trackingLinkDoc.ref.update({
      clickCount: admin.firestore.FieldValue.increment(1),
      lastClickAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Actualizar el estado del lead si es un click de catálogo
    if (trackingData.type === 'catalogo') {
      const leadRef = db
        .collection('organizations')
        .doc(organizationId)
        .collection('leads')
        .doc(trackingData.leadId);

      const leadDoc = await leadRef.get();
      if (leadDoc.exists) {
        const currentStatus = leadDoc.data()?.status;
        
        // Solo actualizar si está en estado "contactado" o "nuevo"
        if (currentStatus === 'contactado' || currentStatus === 'nuevo') {
          await leadRef.update({
            status: 'contactado',
            responseStatus: 'visito_catalogo',
            lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
            catalogVisitedAt: admin.firestore.FieldValue.serverTimestamp(),
            notes: admin.firestore.FieldValue.arrayUnion({
              id: Date.now().toString(),
              text: `Cliente visitó el catálogo: ${trackingData.title}`,
              timestamp: new Date().toISOString(),
              type: 'catalog_visit',
              metadata: {
                trackingId,
                linkTitle: trackingData.title,
                clickData: clickRecord.clickData
              }
            })
          });

          console.log(`✅ Lead ${trackingData.leadId} actualizado a "contactado - visitó catálogo"`);
        }
      }
    }

    console.log(`✅ Click registrado para tracking ID: ${trackingId}`);

    return NextResponse.json({
      success: true,
      destinationUrl: trackingData.destinationUrl,
      message: 'Click registrado exitosamente'
    });

  } catch (error) {
    console.error('Error recording click:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}