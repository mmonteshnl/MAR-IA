import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { WhatsAppMessage, WhatsAppConversation } from '@/types';

interface EvolutionWebhookMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      url: string;
      mimetype: string;
      caption?: string;
    };
    documentMessage?: {
      url: string;
      mimetype: string;
      fileName?: string;
      caption?: string;
    };
    audioMessage?: {
      url: string;
      mimetype: string;
    };
    videoMessage?: {
      url: string;
      mimetype: string;
      caption?: string;
    };
    locationMessage?: {
      degreesLatitude: number;
      degreesLongitude: number;
    };
    contactMessage?: {
      displayName: string;
      vcard: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
  instance: string;
}

interface EvolutionWebhookPayload {
  event: string;
  data: EvolutionWebhookMessage;
  instance: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: EvolutionWebhookPayload = await request.json();
    
    console.log('WhatsApp webhook received:', {
      event: payload.event,
      instance: payload.instance,
      messageId: payload.data?.key?.id
    });

    // Only handle message events
    if (payload.event !== 'messages.upsert') {
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    const messageData = payload.data;
    const instanceName = payload.instance;

    // Find the WhatsApp instance in our database
    const instanceQuery = await db
      .collectionGroup('whatsapp_instances')
      .where('instanceName', '==', instanceName)
      .where('isActive', '==', true)
      .get();

    if (instanceQuery.empty) {
      console.error('WhatsApp instance not found:', instanceName);
      return NextResponse.json({ success: false, message: 'Instance not found' }, { status: 404 });
    }

    const instanceDoc = instanceQuery.docs[0];
    const instanceData = instanceDoc.data();
    const organizationId = instanceData.organizationId;
    const instanceId = instanceDoc.id;

    // Extract phone numbers
    const contactNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
    const isFromBot = messageData.key.fromMe;
    const direction = isFromBot ? 'outbound' : 'inbound';

    // Extract message content and type
    const { content, messageType } = extractMessageContent(messageData.message);

    // Find or create conversation
    const conversationRef = await findOrCreateConversation(
      organizationId,
      instanceId,
      contactNumber,
      messageData.pushName
    );

    // Create message record
    const messageRecord: Omit<WhatsAppMessage, 'id'> = {
      conversationId: conversationRef.id,
      organizationId,
      instanceId,
      messageId: messageData.key.id,
      type: messageType,
      direction,
      content,
      status: 'delivered',
      timestamp: Timestamp.fromMillis(messageData.messageTimestamp * 1000),
      fromNumber: isFromBot ? instanceData.phoneNumber || '' : contactNumber,
      toNumber: isFromBot ? contactNumber : instanceData.phoneNumber || '',
      isFromBot,
      createdAt: Timestamp.now(),
      metadata: {
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      }
    };

    // Save message to Firestore
    await db
      .collection('organizations')
      .doc(organizationId)
      .collection('whatsapp_conversations')
      .doc(conversationRef.id)
      .collection('messages')
      .add(messageRecord);

    // Update conversation
    await conversationRef.update({
      lastMessageAt: messageRecord.timestamp,
      messageCount: instanceData.increment ? instanceData.increment(1) : 1,
      unreadCount: isFromBot ? 0 : instanceData.increment ? instanceData.increment(1) : 1,
      updatedAt: Timestamp.now(),
      'metadata.lastActivity': Timestamp.now()
    });

    // If this is an inbound message, try to find and update the associated lead
    if (!isFromBot) {
      await updateAssociatedLead(organizationId, contactNumber, content.text);
    }

    console.log('WhatsApp message processed successfully:', {
      conversationId: conversationRef.id,
      messageType,
      direction
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Message processed successfully',
      conversationId: conversationRef.id 
    });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function extractMessageContent(message: EvolutionWebhookMessage['message']) {
  // Text message
  if (message.conversation) {
    return {
      content: { text: message.conversation },
      messageType: 'text' as const
    };
  }

  // Extended text message
  if (message.extendedTextMessage) {
    return {
      content: { text: message.extendedTextMessage.text },
      messageType: 'text' as const
    };
  }

  // Image message
  if (message.imageMessage) {
    return {
      content: {
        media: {
          url: message.imageMessage.url,
          mimetype: message.imageMessage.mimetype,
          caption: message.imageMessage.caption
        }
      },
      messageType: 'image' as const
    };
  }

  // Document message
  if (message.documentMessage) {
    return {
      content: {
        media: {
          url: message.documentMessage.url,
          mimetype: message.documentMessage.mimetype,
          filename: message.documentMessage.fileName,
          caption: message.documentMessage.caption
        }
      },
      messageType: 'document' as const
    };
  }

  // Audio message
  if (message.audioMessage) {
    return {
      content: {
        media: {
          url: message.audioMessage.url,
          mimetype: message.audioMessage.mimetype
        }
      },
      messageType: 'audio' as const
    };
  }

  // Video message
  if (message.videoMessage) {
    return {
      content: {
        media: {
          url: message.videoMessage.url,
          mimetype: message.videoMessage.mimetype,
          caption: message.videoMessage.caption
        }
      },
      messageType: 'video' as const
    };
  }

  // Location message
  if (message.locationMessage) {
    return {
      content: {
        location: {
          latitude: message.locationMessage.degreesLatitude,
          longitude: message.locationMessage.degreesLongitude
        }
      },
      messageType: 'location' as const
    };
  }

  // Contact message
  if (message.contactMessage) {
    return {
      content: {
        contact: {
          name: message.contactMessage.displayName,
          phone: extractPhoneFromVCard(message.contactMessage.vcard)
        }
      },
      messageType: 'contact' as const
    };
  }

  // Unknown message type
  return {
    content: { text: '[Mensaje no soportado]' },
    messageType: 'text' as const
  };
}

function extractPhoneFromVCard(vcard: string): string {
  const phoneMatch = vcard.match(/TEL[^:]*:([^\n\r]+)/);
  return phoneMatch ? phoneMatch[1].trim() : '';
}

async function findOrCreateConversation(
  organizationId: string,
  instanceId: string,
  contactNumber: string,
  contactName?: string
) {
  // First, try to find existing conversation
  const existingQuery = await db
    .collection('organizations')
    .doc(organizationId)
    .collection('whatsapp_conversations')
    .where('instanceId', '==', instanceId)
    .where('contactNumber', '==', contactNumber)
    .where('status', '!=', 'archived')
    .limit(1)
    .get();

  if (!existingQuery.empty) {
    return existingQuery.docs[0].ref;
  }

  // Try to find associated lead by phone number
  let leadId = null;
  try {
    const leadQuery = await db
      .collectionGroup('leads')
      .where('phoneNumber', '==', contactNumber)
      .limit(1)
      .get();

    if (!leadQuery.empty) {
      leadId = leadQuery.docs[0].id;
    }
  } catch (error) {
    console.warn('Could not find lead for phone number:', contactNumber);
  }

  // Create new conversation
  const now = Timestamp.now();
  const newConversation: Omit<WhatsAppConversation, 'id'> = {
    organizationId,
    instanceId,
    leadId: leadId || `unknown_${contactNumber}`,
    contactNumber,
    contactName,
    status: 'active',
    lastMessageAt: now,
    messageCount: 0,
    unreadCount: 0,
    tags: [],
    createdAt: now,
    updatedAt: now,
    metadata: {
      firstContact: now,
      lastActivity: now
    }
  };

  const conversationRef = await db
    .collection('organizations')
    .doc(organizationId)
    .collection('whatsapp_conversations')
    .add(newConversation);

  return conversationRef;
}

async function updateAssociatedLead(
  organizationId: string,
  contactNumber: string,
  messageText?: string
) {
  try {
    // Find lead by phone number
    const leadQuery = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('leads')
      .where('phoneNumber', '==', contactNumber)
      .limit(1)
      .get();

    if (leadQuery.empty) return;

    const leadDoc = leadQuery.docs[0];
    const leadData = leadDoc.data();

    // Update lead's last activity and add a note about the WhatsApp message
    const updates: any = {
      updatedAt: Timestamp.now(),
      'metadata.lastWhatsAppMessage': Timestamp.now()
    };

    // If lead doesn't have a stage or is new, update to contacted
    if (!leadData.stage || leadData.stage === 'Nuevo') {
      updates.stage = 'Contactado';
    }

    await leadDoc.ref.update(updates);

    // Add communication record
    if (messageText && messageText.length > 0) {
      await db
        .collection('organizations')
        .doc(organizationId)
        .collection('communications')
        .add({
          leadId: leadDoc.id,
          organizationId,
          type: 'whatsapp',
          direction: 'inbound',
          content: messageText.substring(0, 500), // Limit content length
          status: 'delivered',
          timestamp: Timestamp.now(),
          createdBy: 'system',
          metadata: {
            isAutomated: false,
            messageType: 'text'
          }
        });
    }

  } catch (error) {
    console.error('Error updating associated lead:', error);
  }
}

// Allow webhook to be called without authentication
export const runtime = 'nodejs';
export const preferredRegion = 'auto';