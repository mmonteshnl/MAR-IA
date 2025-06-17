import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppCooldownService } from '@/lib/whatsapp-cooldown';
import { getEvolutionAPI } from '@/lib/evolution-api';

interface SendMessageRequest {
  organizationId: string;
  instanceId: string;
  message: {
    number: string;
    text: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();
    const { organizationId, instanceId, message } = body;

    if (!organizationId || !instanceId || !message?.number || !message?.text) {
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

    // Send message via Evolution API
    const evolutionAPI = getEvolutionAPI();
    const result = await evolutionAPI.sendTextMessage({
      number: message.number,
      text: message.text,
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
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}