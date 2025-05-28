import { NextRequest, NextResponse } from 'next/server';
import { assessRiskFactors } from '@/ai/flows/assessRiskFactorsFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await assessRiskFactors(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error assessing risk factors:', error);
    return NextResponse.json(
      { error: 'Error al evaluar factores de riesgo' },
      { status: 500 }
    );
  }
}