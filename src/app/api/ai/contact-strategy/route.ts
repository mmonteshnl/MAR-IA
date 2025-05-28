import { NextRequest, NextResponse } from 'next/server';
import { generateContactStrategy } from '@/ai/flows/generateContactStrategyFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateContactStrategy(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating contact strategy:', error);
    return NextResponse.json(
      { error: 'Error al generar estrategias de contacto' },
      { status: 500 }
    );
  }
}