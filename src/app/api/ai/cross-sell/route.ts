import { NextRequest, NextResponse } from 'next/server';
import { generateCrossSellOpportunities } from '@/ai/flows/generateCrossSellOpportunitiesFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateCrossSellOpportunities(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating cross-sell opportunities:', error);
    return NextResponse.json(
      { error: 'Error al generar oportunidades de venta cruzada' },
      { status: 500 }
    );
  }
}