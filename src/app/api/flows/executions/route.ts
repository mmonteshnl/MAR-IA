import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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

export async function GET(request: NextRequest) {
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
    await validateUserPermissions(authHeader, orgId);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const createdBy = searchParams.get('createdBy');

    // Build query
    const db = getFirestore();
    let query = db
      .collection('organizations')
      .doc(orgId)
      .collection('executions')
      .orderBy('startedAt', 'desc')
      .limit(Math.min(limit, 100)); // Cap at 100 for performance

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (createdBy) {
      query = query.where('createdBy', '==', createdBy);
    }

    const executionsSnapshot = await query.get();

    const executions = executionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        executionId: doc.id,
        organizationId: data.organizationId,
        status: data.status,
        currentStep: data.currentStep,
        startedAt: data.startedAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        createdBy: data.createdBy,
        // Include step results for completed executions only
        stepResults: data.status === 'completed' ? data.stepResults : undefined,
        // Include minimal error info for failed executions
        hasError: data.status === 'failed',
        errorSummary: data.status === 'failed' ? 'Execution failed' : undefined
      };
    });

    return NextResponse.json({ 
      executions,
      total: executions.length,
      organizationId: orgId
    });

  } catch (error) {
    console.error('Fetch executions error:', error);
    
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

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('id');

    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID is required' }, 
        { status: 400 }
      );
    }

    // Check if user is admin (only admins can delete executions)
    const db = getFirestore();
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    const orgData = orgDoc.data()!;
    const isAdmin = userId === orgData.ownerId || (orgData.adminIds && orgData.adminIds.includes(userId));

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied: Only administrators can delete executions' }, 
        { status: 403 }
      );
    }

    // Delete execution
    await db
      .collection('organizations')
      .doc(orgId)
      .collection('executions')
      .doc(executionId)
      .delete();

    return NextResponse.json({ 
      success: true, 
      message: 'Execution deleted successfully',
      executionId 
    });

  } catch (error) {
    console.error('Delete execution error:', error);
    
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