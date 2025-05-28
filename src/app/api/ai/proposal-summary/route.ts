import { NextRequest, NextResponse } from 'next/server';
import { generateProposalSummary } from '@/ai/flows/generateProposalSummaryFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateProposalSummary(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating proposal summary:', error);
    return NextResponse.json(
      { error: 'Error al generar resumen de propuesta' },
      { status: 500 }
    );
  }
}