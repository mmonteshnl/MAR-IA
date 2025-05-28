import { NextRequest, NextResponse } from 'next/server';
import { generateFollowUpReminderMessage } from '@/ai/flows/generateFollowUpReminderMessageFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateFollowUpReminderMessage(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating follow-up reminder:', error);
    return NextResponse.json(
      { error: 'Error al generar recordatorio de seguimiento' },
      { status: 500 }
    );
  }
}