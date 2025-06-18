import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { FlowExecutor } from '@/lib/flow-executor';
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

export async function POST(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
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

    const { executionId } = params;

    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID is required' }, 
        { status: 400 }
      );
    }

    // Load existing execution state
    const executor = await FlowExecutor.loadExecutionState(orgId, executionId);
    
    if (!executor) {
      return NextResponse.json(
        { error: 'Execution not found or access denied' }, 
        { status: 404 }
      );
    }

    // Verify user has permission to resume this execution
    const db = getFirestore();
    const executionDoc = await db
      .collection('organizations')
      .doc(orgId)
      .collection('executions')
      .doc(executionId)
      .get();

    if (!executionDoc.exists) {
      return NextResponse.json(
        { error: 'Execution not found' }, 
        { status: 404 }
      );
    }

    const executionData = executionDoc.data()!;
    
    // Check if user is the creator or an admin
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    const orgData = orgDoc.data()!;
    const isAdmin = userId === orgData.ownerId || (orgData.adminIds && orgData.adminIds.includes(userId));
    const isCreator = userId === executionData.createdBy;

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied: You can only resume your own executions' }, 
        { status: 403 }
      );
    }

    // Resume execution (this would involve implementing resume logic in FlowExecutor)
    // For now, return the current state
    return NextResponse.json({
      success: true,
      executionId: executionId,
      status: executionData.status,
      currentStep: executionData.currentStep,
      results: executionData.stepResults,
      startedAt: executionData.startedAt,
      updatedAt: executionData.updatedAt,
      message: 'Execution state retrieved successfully'
    });

  } catch (error) {
    console.error('Resume execution error:', error);
    
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