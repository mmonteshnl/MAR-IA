import { NextRequest, NextResponse } from 'next/server';
import { generateRecoveryStrategy } from '@/ai/flows/generateRecoveryStrategyFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateRecoveryStrategy(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating recovery strategy:', error);
    return NextResponse.json(
      { error: 'Error al generar estrategia de recuperación' },
      { status: 500 }
    );
  }
}