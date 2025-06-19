import { NextRequest, NextResponse } from 'next/server';

interface ExecutionStatus {
  executionId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  progress?: {
    totalSteps: number;
    completedSteps: number;
    currentStep?: string;
  };
  results?: any;
  error?: string;
}

// Simulación de storage en memoria para demo (en producción usar base de datos)
const executionStorage = new Map<string, ExecutionStatus>();

export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params;

    if (!executionId) {
      return NextResponse.json({ 
        error: 'Execution ID is required'
      }, { status: 400 });
    }

    // Solo para desarrollo
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'This endpoint is only available in development mode'
      }, { status: 403 });
    }

    // Buscar el estado de la ejecución
    const execution = executionStorage.get(executionId);

    if (!execution) {
      // Simular estado para ejecuciones que no están en memoria
      const now = new Date().toISOString();
      const simulatedExecution: ExecutionStatus = {
        executionId,
        status: 'completed',
        startedAt: new Date(Date.now() - 30000).toISOString(), // 30 segundos atrás
        completedAt: new Date(Date.now() - 5000).toISOString(), // 5 segundos atrás
        progress: {
          totalSteps: 3,
          completedSteps: 3
        },
        results: {
          summary: 'Execution completed successfully',
          note: 'This is a simulated status for demo purposes'
        }
      };

      return NextResponse.json(simulatedExecution);
    }

    return NextResponse.json(execution);

  } catch (error) {
    console.error('Error fetching execution status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Actualizar estado de ejecución (para uso interno)
export async function POST(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params;
    const body = await request.json();

    // Solo para desarrollo
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'This endpoint is only available in development mode'
      }, { status: 403 });
    }

    // Actualizar estado en memoria
    const existingExecution = executionStorage.get(executionId);
    
    const updatedExecution: ExecutionStatus = {
      ...existingExecution,
      executionId,
      ...body,
      updatedAt: new Date().toISOString()
    };

    executionStorage.set(executionId, updatedExecution);

    return NextResponse.json(updatedExecution);

  } catch (error) {
    console.error('Error updating execution status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}