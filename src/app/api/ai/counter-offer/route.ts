import { NextRequest, NextResponse } from 'next/server';
import { generateCounterOfferMessage } from '@/ai/flows/generateCounterOfferMessageFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateCounterOfferMessage(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating counter offer:', error);
    return NextResponse.json(
      { error: 'Error al generar contraoferta' },
      { status: 500 }
    );
  }
}