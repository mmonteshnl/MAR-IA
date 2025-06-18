import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { getEvolutionAPI } from '@/lib/evolution-api';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const instanceId = searchParams.get('instanceId');
    
    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'Organization ID requerido' }, { status: 400 });
    }

    if (instanceId) {
      // Check specific instance status
      const instanceRef = db
        .collection('organizations')
        .doc(organizationId)
        .collection('whatsapp_instances')
        .doc(instanceId);

      const doc = await instanceRef.get();
      if (!doc.exists) {
        return NextResponse.json({ success: false, message: 'Instancia no encontrada' }, { status: 404 });
      }

      const instanceData = doc.data();
      const evolutionAPI = getEvolutionAPI();
      
      // Check live connection status
      const statusResult = await evolutionAPI.checkConnectionStatus(instanceId);
      
      // Update status in database
      const newStatus = statusResult.success ? 'connected' : 'disconnected';
      await instanceRef.update({
        connectionStatus: newStatus,
        lastStatusCheck: Timestamp.now()
      });

      return NextResponse.json({
        success: true,
        data: {
          instanceId,
          connectionStatus: newStatus,
          lastCheck: new Date().toISOString(),
          details: statusResult.data
        }
      });
    } else {
      // Check all instances for organization
      const instancesRef = db
        .collection('organizations')
        .doc(organizationId)
        .collection('whatsapp_instances');

      const snapshot = await instancesRef
        .where('isActive', '==', true)
        .get();

      const results = [];
      const evolutionAPI = getEvolutionAPI();

      for (const doc of snapshot.docs) {
        const instanceData = doc.data();
        const statusResult = await evolutionAPI.checkConnectionStatus(doc.id);
        
        const newStatus = statusResult.success ? 'connected' : 'disconnected';
        
        // Update status in database
        await doc.ref.update({
          connectionStatus: newStatus,
          lastStatusCheck: Timestamp.now()
        });

        results.push({
          instanceId: doc.id,
          instanceName: instanceData.instanceName,
          connectionStatus: newStatus,
          lastCheck: new Date().toISOString(),
          phoneNumber: instanceData.phoneNumber
        });
      }

      return NextResponse.json({
        success: true,
        data: results
      });
    }

  } catch (error) {
    console.error('Error checking WhatsApp status:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    const body = await request.json();
    const { organizationId, instanceId, action } = body;
    
    if (!organizationId || !instanceId || !action) {
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

    const instanceData = doc.data();
    const evolutionAPI = getEvolutionAPI();

    switch (action) {
      case 'connect':
        // Get QR code for connection
        const qrResult = await evolutionAPI.getQRCode(instanceData.instanceName);
        if (qrResult.success) {
          await instanceRef.update({
            connectionStatus: 'connecting',
            qrCode: qrResult.data.qrcode || qrResult.data.base64,
            lastStatusCheck: Timestamp.now()
          });
          
          return NextResponse.json({
            success: true,
            data: {
              qrCode: qrResult.data.qrcode || qrResult.data.base64,
              message: 'Escanea el código QR con WhatsApp'
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            message: qrResult.error || 'Error al obtener código QR'
          });
        }

      case 'disconnect':
        // Mark as disconnected (Evolution API will handle the actual disconnection)
        await instanceRef.update({
          connectionStatus: 'disconnected',
          qrCode: null,
          lastStatusCheck: Timestamp.now()
        });
        
        return NextResponse.json({
          success: true,
          message: 'Instancia desconectada'
        });

      case 'refresh':
        // Force refresh status
        const statusResult = await evolutionAPI.checkConnectionStatus(instanceId);
        const newStatus = statusResult.success ? 'connected' : 'disconnected';
        
        await instanceRef.update({
          connectionStatus: newStatus,
          lastStatusCheck: Timestamp.now()
        });

        return NextResponse.json({
          success: true,
          data: {
            connectionStatus: newStatus,
            details: statusResult.data
          }
        });

      default:
        return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing WhatsApp status:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}