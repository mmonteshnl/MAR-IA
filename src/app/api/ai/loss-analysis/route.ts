import { NextRequest, NextResponse } from 'next/server';
import { analyzeLossReasons } from '@/ai/flows/analyzeLossReasonsFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await analyzeLossReasons(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing loss reasons:', error);
    return NextResponse.json(
      { error: 'Error al analizar razones de pérdida' },
      { status: 500 }
    );
  }
}