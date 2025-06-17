import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppCooldownService } from '@/lib/whatsapp-cooldown';

interface CooldownCheckRequest {
  organizationId: string;
  instanceId: string;
  contactNumber: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CooldownCheckRequest = await request.json();
    const { organizationId, instanceId, contactNumber } = body;

    if (!organizationId || !instanceId || !contactNumber) {
      return NextResponse.json(
        { error: 'organizationId, instanceId y contactNumber son requeridos' },
        { status: 400 }
      );
    }

    // Default cooldown settings - you may want to fetch these from database
    const settings = {
      enabled: true,
      cooldownMinutes: 30,
      maxMessagesPerHour: 5,
    };

    const cooldownCheck = await WhatsAppCooldownService.checkCooldown(
      organizationId,
      instanceId,
      contactNumber,
      settings
    );

    return NextResponse.json({
      success: true,
      data: cooldownCheck,
    });
  } catch (error) {
    console.error('Error checking cooldown:', error);
    return NextResponse.json(
      { error: 'Error al verificar cooldown' },
      { status: 500 }
    );
  }
}