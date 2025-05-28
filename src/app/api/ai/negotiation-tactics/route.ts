import { NextRequest, NextResponse } from 'next/server';
import { suggestNegotiationTactics } from '@/ai/flows/suggestNegotiationTacticsFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await suggestNegotiationTactics(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error suggesting negotiation tactics:', error);
    return NextResponse.json(
      { error: 'Error al sugerir tácticas de negociación' },
      { status: 500 }
    );
  }
}