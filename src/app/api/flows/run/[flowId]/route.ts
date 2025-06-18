import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { FlowExecutor } from '@/lib/flow-executor';
import { RunFlowRequest, Execution, ExecutionStep } from '@/types/conex';
import '@/lib/firebase-admin'; // Initialize Firebase Admin

export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get organization ID and flow ID
    const organizationId = decodedToken.organizationId || request.headers.get('x-organization-id');
    const { flowId } = params;

    if (!organizationId || !flowId) {
      return NextResponse.json({ error: 'Organization ID and flow ID required' }, { status: 400 });
    }

    const body: RunFlowRequest = await request.json();
    const { inputPayload } = body;

    if (!inputPayload) {
      return NextResponse.json({ error: 'Input payload is required' }, { status: 400 });
    }

    const db = getFirestore();

    // Get flow definition
    const flowDoc = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('flows')
      .doc(flowId)
      .get();

    if (!flowDoc.exists) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    const flowData = flowDoc.data();
    if (!flowData.isEnabled) {
      return NextResponse.json({ error: 'Flow is disabled' }, { status: 400 });
    }

    // Create execution record
    const executionRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('flows')
      .doc(flowId)
      .collection('executions')
      .doc();

    const executionData: Omit<Execution, 'id'> = {
      flowId,
      status: 'running',
      startedAt: new Date(),
      triggerType: 'manual',
      inputPayload,
      stepsLog: [],
      organizationId
    };

    await executionRef.set(executionData);

    // Execute flow asynchronously
    executeFlowAsync(
      organizationId,
      flowId,
      executionRef.id,
      flowData.definition,
      inputPayload
    ).catch(error => {
      console.error('Flow execution failed:', error);
    });

    return NextResponse.json({
      executionId: executionRef.id,
      status: 'running',
      message: 'Flow execution started'
    }, { status: 202 });

  } catch (error) {
    console.error('Error starting flow execution:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Async function to execute the flow
async function executeFlowAsync(
  organizationId: string,
  flowId: string,
  executionId: string,
  flowDefinition: any,
  inputPayload: Record<string, any>
): Promise<void> {
  const db = getFirestore();
  const executionRef = db
    .collection('organizations')
    .doc(organizationId)
    .collection('flows')
    .doc(flowId)
    .collection('executions')
    .doc(executionId);

  try {
    // Get required connections for this flow
    const connectionIds = extractConnectionIds(flowDefinition);
    const connections = await getConnections(organizationId, connectionIds);

    // Initialize and execute flow
    const executor = new FlowExecutor();
    await executor.initializeContext(inputPayload, connections);
    
    const result = await executor.executeFlow(flowDefinition);

    // Update execution record
    if (result.success) {
      await executionRef.update({
        status: 'success',
        finishedAt: new Date(),
        stepsLog: generateStepsLog(result.results)
      });
    } else {
      await executionRef.update({
        status: 'failed',
        finishedAt: new Date(),
        error: {
          message: result.error || 'Unknown execution error',
          step: 'execution'
        },
        stepsLog: generateStepsLog(result.results)
      });
    }

  } catch (error) {
    console.error('Flow execution error:', error);
    
    // Update execution record with error
    await executionRef.update({
      status: 'failed',
      finishedAt: new Date(),
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        step: 'initialization'
      }
    });
  }
}

// Extract connection IDs from flow definition
function extractConnectionIds(flowDefinition: any): string[] {
  const connectionIds: string[] = [];
  
  if (flowDefinition.nodes) {
    flowDefinition.nodes.forEach((node: any) => {
      if (node.type === 'api_call' && node.data.config.connectionId) {
        connectionIds.push(node.data.config.connectionId);
      }
    });
  }

  return [...new Set(connectionIds)]; // Remove duplicates
}

// Get connections from Firestore
async function getConnections(
  organizationId: string,
  connectionIds: string[]
): Promise<Array<{ id: string; credentials: string; type: string }>> {
  if (connectionIds.length === 0) return [];

  const db = getFirestore();
  const connections: Array<{ id: string; credentials: string; type: string }> = [];

  for (const connectionId of connectionIds) {
    const connectionDoc = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('connections')
      .doc(connectionId)
      .get();

    if (connectionDoc.exists) {
      const data = connectionDoc.data();
      connections.push({
        id: connectionId,
        credentials: data.credentials,
        type: data.type
      });
    }
  }

  return connections;
}

// Generate steps log from execution results
function generateStepsLog(results: Record<string, any>): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  
  Object.entries(results).forEach(([nodeId, result]) => {
    steps.push({
      nodeId,
      nodeName: `Node ${nodeId}`,
      status: result ? 'success' : 'failed',
      startedAt: new Date(),
      finishedAt: new Date(),
      output: result
    });
  });

  return steps;
}

// GET endpoint to check execution status
export async function GET(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    const organizationId = decodedToken.organizationId || request.headers.get('x-organization-id');
    const { flowId } = params;
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!organizationId || !flowId || !executionId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const db = getFirestore();
    const executionDoc = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('flows')
      .doc(flowId)
      .collection('executions')
      .doc(executionId)
      .get();

    if (!executionDoc.exists) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    const executionData = executionDoc.data();
    return NextResponse.json({
      id: executionDoc.id,
      ...executionData,
      startedAt: executionData.startedAt.toDate(),
      finishedAt: executionData.finishedAt?.toDate()
    });

  } catch (error) {
    console.error('Error fetching execution:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}