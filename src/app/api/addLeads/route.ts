
import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

interface LeadData {
  place_id: string;
  name: string;
  vicinity?: string;
  phone?: string;
  website?: string;
  businessType?: string; // Añadido para IA
}

export async function POST(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    console.error("Firebase Admin SDK not initialized. Ensure FIREBASE_SERVICE_ACCOUNT_JSON environment variable is correctly set.");
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado. Verifica la variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON en la configuración del servidor.' 
    }, { status: 500 });
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'No autorizado: Token faltante o inválido.' }, { status: 401 });
  }
  const token = authorizationHeader.split('Bearer ')[1];

  let decodedToken;
  try {
    decodedToken = await authAdmin.verifyIdToken(token);
  } catch (error) {
    console.error('Error al verificar el token de ID de Firebase:', error);
    return NextResponse.json({ message: 'No autorizado: Token inválido.' }, { status: 401 });
  }

  const uid = decodedToken.uid;
  if (!uid) {
    return NextResponse.json({ message: 'No autorizado: UID no encontrado en el token.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const leads: LeadData[] = body.leads;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ message: 'No se proporcionaron leads o el formato es inválido.' }, { status: 400 });
    }

    console.log(`Attempting to save ${leads.length} leads for UID: ${uid}`);

    const batch = firestoreDbAdmin.batch();
    const leadsCollection = firestoreDbAdmin.collection('leads');
    const timestamp = FieldValue.serverTimestamp();

    leads.forEach(lead => {
      const leadDocRef = leadsCollection.doc(); 
      const leadDataToSave = {
        uid: uid,
        placeId: lead.place_id,
        name: lead.name,
        address: lead.vicinity || null,
        phone: lead.phone || null,
        website: lead.website || null,
        businessType: lead.businessType || null, // Guardar tipo de negocio
        source: 'google_places_search',
        stage: 'Nuevo', 
        createdAt: timestamp,
        updatedAt: timestamp, 
      };
      console.log(`Preparing to save lead: ${JSON.stringify(leadDataToSave)}`);
      batch.set(leadDocRef, leadDataToSave);
    });

    await batch.commit();
    console.log(`Successfully saved ${leads.length} leads for UID: ${uid}`);

    return NextResponse.json({ message: `¡${leads.length} lead(s) guardados correctamente!` }, { status: 201 });
  } catch (error: any) {
    console.error('Error al guardar leads en Firestore:', error);
    let requestBodyForLog;
    try {
      requestBodyForLog = await request.json(); // This might fail if body already read
    } catch (e) {
      requestBodyForLog = "Could not re-parse request body for logging. Check original body if available.";
    }
    console.error('Input data that caused error:', JSON.stringify(requestBodyForLog, null, 2));
    return NextResponse.json({ message: 'Falló al guardar los leads.', error: error.message || 'Error desconocido de Firestore' }, { status: 500 });
  }
}
