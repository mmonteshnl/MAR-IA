import { NextRequest, NextResponse } from 'next/server';
import { authAdmin, firestoreDbAdmin } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await authAdmin.verifyIdToken(token);
    
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId requerido' }, { status: 400 });
    }

    // Verificar instancias de WhatsApp de la organización
    const instancesQuery = await firestoreDbAdmin
      .collection('whatsappInstances')
      .where('organizationId', '==', organizationId)
      .get();

    if (instancesQuery.empty) {
      return NextResponse.json({
        success: true,
        data: {
          hasInstances: false,
          webhookConfigured: false,
          activeInstances: 0,
          alerts: [
            {
              type: 'warning',
              title: 'Sin instancias de WhatsApp',
              message: 'No tienes instancias de WhatsApp configuradas. Crea una instancia para comenzar.',
              action: 'Ir a Configuración'
            }
          ]
        }
      });
    }

    const instances = instancesQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const alerts = [];
    let webhookConfigured = false;
    let activeInstances = 0;

    // Verificar estado de cada instancia
    for (const instance of instances) {
      if (instance.status === 'connected') {
        activeInstances++;
      }

      // Verificar si el webhook está configurado
      if (instance.webhookUrl && instance.webhookEvents) {
        webhookConfigured = true;
      } else {
        alerts.push({
          type: 'error',
          title: 'Webhook no configurado',
          message: `La instancia "${instance.name}" no tiene webhook configurado.`,
          action: 'Configurar Webhook',
          instanceId: instance.id
        });
      }

      // Verificar conexión
      if (instance.status === 'disconnected') {
        alerts.push({
          type: 'warning',
          title: 'Instancia desconectada',
          message: `La instancia "${instance.name}" está desconectada.`,
          action: 'Reconectar',
          instanceId: instance.id
        });
      }

      // Verificar última actividad
      const lastActivity = instance.lastActivity;
      if (lastActivity) {
        const hoursSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
        if (hoursSinceActivity > 24) {
          alerts.push({
            type: 'info',
            title: 'Instancia inactiva',
            message: `La instancia "${instance.name}" no ha tenido actividad en ${Math.floor(hoursSinceActivity)} horas.`,
            action: 'Verificar Estado',
            instanceId: instance.id
          });
        }
      }
    }

    // Alertas generales
    if (activeInstances === 0) {
      alerts.unshift({
        type: 'error',
        title: 'Sin instancias activas',
        message: 'No tienes ninguna instancia de WhatsApp conectada.',
        action: 'Conectar Instancia'
      });
    }

    if (!webhookConfigured) {
      alerts.unshift({
        type: 'error',
        title: 'Webhook no configurado',
        message: 'Es necesario configurar el webhook para recibir mensajes automáticamente.',
        action: 'Configurar Webhook'
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasInstances: true,
        webhookConfigured,
        activeInstances,
        totalInstances: instances.length,
        alerts,
        instances: instances.map(instance => ({
          id: instance.id,
          name: instance.name,
          status: instance.status,
          lastActivity: instance.lastActivity
        }))
      }
    });

  } catch (error) {
    console.error('Error checking WhatsApp webhook status:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}