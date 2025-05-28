import { NextRequest, NextResponse } from 'next/server';
import { generateThankYouMessage } from '@/ai/flows/generateThankYouMessageFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateThankYouMessage(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating thank you message:', error);
    return NextResponse.json(
      { error: 'Error al generar mensaje de agradecimiento' },
      { status: 500 }
    );
  }
}