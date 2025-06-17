import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppCooldownService } from '@/lib/whatsapp-cooldown';
import { getEvolutionAPI } from '@/lib/evolution-api';

interface SendMediaRequest {
  organizationId: string;
  instanceId: string;
  message: {
    number: string;
    mediatype: 'image' | 'video' | 'audio' | 'document';
    media: string;
    caption?: string;
    fileName?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMediaRequest = await request.json();
    const { organizationId, instanceId, message } = body;

    if (!organizationId || !instanceId || !message?.number || !message?.media) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Default cooldown settings - you may want to fetch these from database
    const settings = {
      enabled: true,
      cooldownMinutes: 30,
      maxMessagesPerHour: 5,
    };

    // Check cooldown
    const cooldownCheck = await WhatsAppCooldownService.checkCooldown(
      organizationId,
      instanceId,
      message.number,
      settings
    );

    if (cooldownCheck.inCooldown) {
      return NextResponse.json({
        success: false,
        error: `Contacto en cooldown. Intenta en ${cooldownCheck.remainingMinutes} minutos.`,
        data: cooldownCheck,
      });
    }

    // Send media via Evolution API
    const evolutionAPI = getEvolutionAPI();
    const result = await evolutionAPI.sendMediaMessage({
      number: message.number,
      mediatype: message.mediatype,
      media: message.media,
      caption: message.caption,
      fileName: message.fileName,
    });

    if (result.success) {
      // Record message sent
      await WhatsAppCooldownService.recordMessageSent(
        organizationId,
        instanceId,
        message.number,
        settings
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending media:', error);
    return NextResponse.json(
      { error: 'Error al enviar media' },
      { status: 500 }
    );
  }
}