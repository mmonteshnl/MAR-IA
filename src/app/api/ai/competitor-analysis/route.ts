import { NextRequest, NextResponse } from 'next/server';
import { generateCompetitorAnalysisInsights } from '@/ai/flows/generateCompetitorAnalysisInsightsFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateCompetitorAnalysisInsights(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating competitor analysis:', error);
    return NextResponse.json(
      { error: 'Error al generar análisis de competencia' },
      { status: 500 }
    );
  }
}