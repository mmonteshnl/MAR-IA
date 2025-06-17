import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';
import type { WhatsAppInstance } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'Organization ID requerido' }, { status: 400 });
    }

    // Get all WhatsApp instances for the organization
    const instancesRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('whatsapp_instances');

    const snapshot = await instancesRef
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const instances: WhatsAppInstance[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      instances.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        lastStatusCheck: data.lastStatusCheck?.toDate?.()?.toISOString() || data.lastStatusCheck,
      } as WhatsAppInstance);
    });

    return NextResponse.json({
      success: true,
      data: instances
    });

  } catch (error) {
    console.error('Error fetching WhatsApp instances:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    const body = await request.json();
    const { organizationId, instanceData } = body;
    
    if (!organizationId || !instanceData) {
      return NextResponse.json({ success: false, message: 'Datos de organización e instancia requeridos' }, { status: 400 });
    }

    const {
      instanceName,
      webhookUrl,
      apiKey,
      settings = {
        autoReply: false,
        businessHours: {
          enabled: false,
          timezone: 'America/Panama',
          schedule: [
            { day: 'monday', start: '09:00', end: '18:00', enabled: true },
            { day: 'tuesday', start: '09:00', end: '18:00', enabled: true },
            { day: 'wednesday', start: '09:00', end: '18:00', enabled: true },
            { day: 'thursday', start: '09:00', end: '18:00', enabled: true },
            { day: 'friday', start: '09:00', end: '18:00', enabled: true },
            { day: 'saturday', start: '09:00', end: '14:00', enabled: false },
            { day: 'sunday', start: '09:00', end: '14:00', enabled: false },
          ]
        },
        antiSpam: {
          enabled: true,
          cooldownMinutes: 60,
          maxMessagesPerHour: 5
        }
      }
    } = instanceData;

    const now = Timestamp.now();
    
    const newInstance: Omit<WhatsAppInstance, 'id'> = {
      organizationId,
      instanceName,
      webhookUrl,
      apiKey,
      isActive: true,
      connectionStatus: 'disconnected',
      lastStatusCheck: now,
      createdAt: now,
      updatedAt: now,
      createdBy: decodedToken.uid,
      settings
    };

    // Add to Firestore
    const instanceRef = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('whatsapp_instances')
      .add(newInstance);

    const createdInstance = {
      id: instanceRef.id,
      ...newInstance,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
      lastStatusCheck: now.toDate().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: createdInstance,
      message: 'Instancia de WhatsApp creada exitosamente'
    });

  } catch (error) {
    console.error('Error creating WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    const body = await request.json();
    const { organizationId, instanceId, updates } = body;
    
    if (!organizationId || !instanceId || !updates) {
      return NextResponse.json({ success: false, message: 'Datos requeridos faltantes' }, { status: 400 });
    }

    const instanceRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('whatsapp_instances')
      .doc(instanceId);

    const doc = await instanceRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: 'Instancia no encontrada' }, { status: 404 });
    }

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    await instanceRef.update(updateData);

    // Get updated document
    const updatedDoc = await instanceRef.get();
    const updatedData = updatedDoc.data();

    const instance = {
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || updatedData?.createdAt,
      updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || updatedData?.updatedAt,
      lastStatusCheck: updatedData?.lastStatusCheck?.toDate?.()?.toISOString() || updatedData?.lastStatusCheck,
    };

    return NextResponse.json({
      success: true,
      data: instance,
      message: 'Instancia actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const instanceId = searchParams.get('instanceId');
    
    if (!organizationId || !instanceId) {
      return NextResponse.json({ success: false, message: 'Organization ID e Instance ID requeridos' }, { status: 400 });
    }

    const instanceRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('whatsapp_instances')
      .doc(instanceId);

    // Soft delete - mark as inactive instead of actual deletion
    await instanceRef.update({
      isActive: false,
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({
      success: true,
      message: 'Instancia desactivada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}