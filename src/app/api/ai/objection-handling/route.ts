import { NextRequest, NextResponse } from 'next/server';
import { generateObjectionHandlingGuidance } from '@/ai/flows/generateObjectionHandlingGuidanceFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateObjectionHandlingGuidance(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating objection handling guidance:', error);
    return NextResponse.json(
      { error: 'Error al generar manejo de objeciones' },
      { status: 500 }
    );
  }
}