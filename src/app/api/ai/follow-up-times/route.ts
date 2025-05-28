import { NextRequest, NextResponse } from 'next/server';
import { suggestBestFollowUpTimes } from '@/ai/flows/suggestBestFollowUpTimesFlow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await suggestBestFollowUpTimes(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error suggesting follow-up times:', error);
    return NextResponse.json(
      { error: 'Error al sugerir mejores momentos' },
      { status: 500 }
    );
  }
}