import { NextRequest, NextResponse } from 'next/server';
import { generateWelcomeMessage, type WelcomeMessageInput } from '@/ai/flows/welcomeMessageFlow';

export async function POST(request: NextRequest) {
  try {
    const body: WelcomeMessageInput = await request.json();
    
    console.log('Welcome message API called with:', body);
    
    if (!body.leadName) {
      return NextResponse.json(
        { error: 'leadName es requerido' },
        { status: 400 }
      );
    }
    
    const result = await generateWelcomeMessage(body);
    
    console.log('Welcome message API result:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Welcome message API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar mensaje';
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}