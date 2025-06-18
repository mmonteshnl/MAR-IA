import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { FlowExecutor, FlowDefinition } from '@/lib/flow-executor';
import '@/lib/firebase-admin';

// Validate user permissions for organization
async function validateUserPermissions(authHeader: string | null, organizationId: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.split('Bearer ')[1];
  const auth = getAuth();
  const decodedToken = await auth.verifyIdToken(token);
  const userId = decodedToken.uid;

  // Verify user belongs to organization
  const db = getFirestore();
  const orgDoc = await db.collection('organizations').doc(organizationId).get();
  
  if (!orgDoc.exists) {
    throw new Error('Organization not found');
  }

  const orgData = orgDoc.data()!;
  if (!orgData.memberIds || !orgData.memberIds.includes(userId)) {
    throw new Error('User is not a member of this organization');
  }

  return { userId, organizationId };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const orgId = request.headers.get('x-organization-id');
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' }, 
        { status: 400 }
      );
    }

    // Validate permissions
    const { userId } = await validateUserPermissions(authHeader, orgId);

    const body = await request.json();
    const { flowDefinition, inputData } = body;

    if (!flowDefinition || !inputData) {
      return NextResponse.json(
        { error: 'Flow definition and input data are required' }, 
        { status: 400 }
      );
    }

    // Validate flow definition structure
    if (!flowDefinition.nodes || !Array.isArray(flowDefinition.nodes)) {
      return NextResponse.json(
        { error: 'Invalid flow definition: nodes array is required' }, 
        { status: 400 }
      );
    }

    // Create flow executor with organization context
    const executor = new FlowExecutor(orgId, userId);
    
    // Get organization connections for the executor
    const db = getFirestore();
    const connectionsSnapshot = await db
      .collection('organizations')
      .doc(orgId)
      .collection('connections')
      .get();

    const connections = connectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      credentials: doc.data().credentials, // This should be encrypted
      type: doc.data().type
    }));

    // Initialize executor context
    await executor.initializeContext(inputData, connections);

    // Execute the flow
    const result = await executor.executeFlow(flowDefinition as FlowDefinition);

    return NextResponse.json({
      success: result.success,
      results: result.results,
      error: result.error,
      executionId: result.executionId
    });

  } catch (error) {
    console.error('Flow execution error:', error);
    
    if (error instanceof Error && error.message.includes('not a member')) {
      return NextResponse.json(
        { error: 'Access denied: User not authorized for this organization' }, 
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}