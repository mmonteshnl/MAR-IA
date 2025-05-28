import { NextRequest, NextResponse } from 'next/server';
import { developNegotiationStrategy } from '@/ai/flows/developNegotiationStrategyFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await developNegotiationStrategy(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error developing negotiation strategy:', error);
    return NextResponse.json(
      { error: 'Error al desarrollar estrategia de negociación' },
      { status: 500 }
    );
  }
}