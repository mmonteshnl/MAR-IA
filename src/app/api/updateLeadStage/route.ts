
import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

interface UpdateLeadStageBody {
  leadId: string;
  newStage: string;
}

export async function POST(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    return NextResponse.json({ message: 'Error del Servidor: Firebase Admin SDK no inicializado.' }, { status: 500 });
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
    const body: UpdateLeadStageBody = await request.json();
    const { leadId, newStage } = body;

    if (!leadId || !newStage) {
      return NextResponse.json({ message: 'Faltan leadId o newStage en la solicitud.' }, { status: 400 });
    }

    const leadDocRef = firestoreDbAdmin.collection('leads').doc(leadId);
    const leadDoc = await leadDocRef.get();

    if (!leadDoc.exists) {
      return NextResponse.json({ message: 'Lead no encontrado.' }, { status: 404 });
    }

    const leadData = leadDoc.data();
    if (leadData?.uid !== uid) {
      return NextResponse.json({ message: 'No autorizado para modificar este lead.' }, { status: 403 });
    }

    await leadDocRef.update({
      stage: newStage,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: 'Etapa del lead actualizada correctamente.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error al actualizar la etapa del lead:', error);
    return NextResponse.json({ message: 'Falló al actualizar la etapa del lead.', error: error.message }, { status: 500 });
  }
}
