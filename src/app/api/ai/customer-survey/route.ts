import { NextRequest, NextResponse } from 'next/server';
import { generateCustomerSurvey } from '@/ai/flows/generateCustomerSurveyFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateCustomerSurvey(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating customer survey:', error);
    return NextResponse.json(
      { error: 'Error al generar encuesta de cliente' },
      { status: 500 }
    );
  }
}