import { NextRequest, NextResponse } from 'next/server';
import { evaluateBusinessFeatures, type EvaluateBusinessInput } from '@/ai/flows/evaluateBusinessFlow';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Evaluate Business API Start ===');
    
    let body: EvaluateBusinessInput;
    try {
      body = await request.json();
      console.log('Request body parsed successfully:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.leadName || typeof body.leadName !== 'string' || body.leadName.trim() === '') {
      console.log('Missing or invalid leadName:', body.leadName);
      return NextResponse.json(
        { error: 'leadName es requerido y debe ser una cadena no vacía' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Calling evaluateBusinessFeatures with:', body);
    
    let result;
    try {
      result = await evaluateBusinessFeatures(body);
      console.log('evaluateBusinessFeatures completed successfully:', result);
    } catch (aiError) {
      console.error('AI Flow error:', aiError);
      console.error('AI Error stack:', aiError instanceof Error ? aiError.stack : 'No stack trace');
      
      return NextResponse.json(
        { error: `Error en el procesamiento de IA: ${aiError instanceof Error ? aiError.message : 'Error desconocido'}` },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!result || typeof result !== 'object') {
      console.error('Invalid result from AI:', result);
      return NextResponse.json(
        { error: 'Respuesta inválida del sistema de IA' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('=== Evaluate Business API Success ===');
    return NextResponse.json(result, {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Evaluate Business API Error ===');
    console.error('Unexpected error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}