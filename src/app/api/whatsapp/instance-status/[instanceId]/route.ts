import { NextRequest, NextResponse } from 'next/server';
import { getEvolutionAPI } from '@/lib/evolution-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { instanceId: string } }
) {
  try {
    const instanceId = params.instanceId;

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId es requerido' },
        { status: 400 }
      );
    }

    const evolutionAPI = getEvolutionAPI();
    const result = await evolutionAPI.getInstanceStatus();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting instance status:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado de instancia' },
      { status: 500 }
    );
  }
}