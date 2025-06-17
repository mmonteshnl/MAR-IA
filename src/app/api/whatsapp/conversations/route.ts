import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';
import type { WhatsAppConversation, WhatsAppMessage } from '@/types';

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
    const leadId = searchParams.get('leadId');
    const instanceId = searchParams.get('instanceId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'Organization ID requerido' }, { status: 400 });
    }

    // Build query
    let query = db
      .collection('organizations')
      .doc(organizationId)
      .collection('whatsapp_conversations')
      .orderBy('lastMessageAt', 'desc');

    // Apply filters
    if (leadId) {
      query = query.where('leadId', '==', leadId);
    }
    if (instanceId) {
      query = query.where('instanceId', '==', instanceId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    // Apply pagination
    if (offset > 0) {
      // For offset pagination, we'd need to implement cursor-based pagination for better performance
      // For now, using limit/offset approach
      query = query.limit(limit).offset(offset);
    } else {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    
    const conversations: WhatsAppConversation[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || data.lastMessageAt,
        metadata: {
          ...data.metadata,
          firstContact: data.metadata?.firstContact?.toDate?.()?.toISOString() || data.metadata?.firstContact,
          lastActivity: data.metadata?.lastActivity?.toDate?.()?.toISOString() || data.metadata?.lastActivity,
        }
      } as WhatsAppConversation);
    });

    return NextResponse.json({
      success: true,
      data: conversations,
      pagination: {
        limit,
        offset,
        total: conversations.length,
        hasMore: conversations.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching WhatsApp conversations:', error);
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
    const { organizationId, conversationData } = body;
    
    if (!organizationId || !conversationData) {
      return NextResponse.json({ success: false, message: 'Datos requeridos faltantes' }, { status: 400 });
    }

    const {
      instanceId,
      leadId,
      contactNumber,
      contactName,
      status = 'active'
    } = conversationData;

    if (!instanceId || !leadId || !contactNumber) {
      return NextResponse.json({ success: false, message: 'instanceId, leadId y contactNumber son requeridos' }, { status: 400 });
    }

    const now = Timestamp.now();
    
    const newConversation: Omit<WhatsAppConversation, 'id'> = {
      organizationId,
      instanceId,
      leadId,
      contactNumber,
      contactName,
      status,
      lastMessageAt: now,
      messageCount: 0,
      unreadCount: 0,
      tags: [],
      createdAt: now,
      updatedAt: now,
      metadata: {
        firstContact: now,
        lastActivity: now,
        businessType: conversationData.businessType,
        leadStage: conversationData.leadStage,
        customerSegment: conversationData.customerSegment
      }
    };

    // Check if conversation already exists
    const existingQuery = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('whatsapp_conversations')
      .where('instanceId', '==', instanceId)
      .where('contactNumber', '==', contactNumber)
      .where('status', '!=', 'archived')
      .get();

    if (!existingQuery.empty) {
      const existing = existingQuery.docs[0];
      return NextResponse.json({
        success: true,
        data: {
          id: existing.id,
          ...existing.data(),
          message: 'Conversación ya existe'
        }
      });
    }

    // Create new conversation
    const conversationRef = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('whatsapp_conversations')
      .add(newConversation);

    const createdConversation = {
      id: conversationRef.id,
      ...newConversation,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
      lastMessageAt: now.toDate().toISOString(),
      metadata: {
        ...newConversation.metadata,
        firstContact: now.toDate().toISOString(),
        lastActivity: now.toDate().toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      data: createdConversation,
      message: 'Conversación creada exitosamente'
    });

  } catch (error) {
    console.error('Error creating WhatsApp conversation:', error);
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
    const { organizationId, conversationId, updates } = body;
    
    if (!organizationId || !conversationId || !updates) {
      return NextResponse.json({ success: false, message: 'Datos requeridos faltantes' }, { status: 400 });
    }

    const conversationRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('whatsapp_conversations')
      .doc(conversationId);

    const doc = await conversationRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: 'Conversación no encontrada' }, { status: 404 });
    }

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // If updating metadata, merge with existing
    if (updates.metadata) {
      const existingData = doc.data();
      updateData.metadata = {
        ...existingData?.metadata,
        ...updates.metadata
      };
    }

    await conversationRef.update(updateData);

    // Get updated document
    const updatedDoc = await conversationRef.get();
    const updatedData = updatedDoc.data();

    const conversation = {
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || updatedData?.createdAt,
      updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || updatedData?.updatedAt,
      lastMessageAt: updatedData?.lastMessageAt?.toDate?.()?.toISOString() || updatedData?.lastMessageAt,
      metadata: {
        ...updatedData?.metadata,
        firstContact: updatedData?.metadata?.firstContact?.toDate?.()?.toISOString() || updatedData?.metadata?.firstContact,
        lastActivity: updatedData?.metadata?.lastActivity?.toDate?.()?.toISOString() || updatedData?.metadata?.lastActivity,
      }
    };

    return NextResponse.json({
      success: true,
      data: conversation,
      message: 'Conversación actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating WhatsApp conversation:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}