import { NextRequest, NextResponse } from 'next/server';
import { generateFollowUpEmail } from '@/ai/flows/generateFollowUpEmailFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateFollowUpEmail(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating follow-up email:', error);
    return NextResponse.json(
      { error: 'Error al generar email de seguimiento' },
      { status: 500 }
    );
  }
}