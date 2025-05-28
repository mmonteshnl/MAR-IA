import { NextRequest, NextResponse } from 'next/server';
import { generateCompetitorReport } from '@/ai/flows/generateCompetitorReportFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateCompetitorReport(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating competitor report:', error);
    return NextResponse.json(
      { error: 'Error al generar informe de competidores' },
      { status: 500 }
    );
  }
}