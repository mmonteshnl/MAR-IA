import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { CreateFlowRequest, Flow } from '@/types/conex';
import '@/lib/firebase-admin'; // Initialize Firebase Admin

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get organization ID
    const organizationId = decodedToken.organizationId || request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const body: CreateFlowRequest = await request.json();
    console.log('🔍 API: Received request body:', body);
    console.log('🔍 API: Organization ID:', organizationId);
    const { name, description, icon, trigger, definition, isEnabled = true } = body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!icon) missingFields.push('icon');
    if (!trigger) missingFields.push('trigger');
    if (!definition) missingFields.push('definition');
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields, 'Body received:', body);
      return NextResponse.json({ 
        error: 'Missing required fields', 
        missingFields,
        receivedFields: Object.keys(body)
      }, { status: 400 });
    }

    // Create flow document
    const db = getFirestore();
    const flowRef = db.collection('organizations').doc(organizationId).collection('flows').doc();
    const now = new Date();
    
    const flowData: Omit<Flow, 'id'> = {
      name,
      description,
      icon,
      trigger,
      definition,
      isEnabled,
      createdAt: now,
      updatedAt: now,
      organizationId
    };

    await flowRef.set(flowData);

    return NextResponse.json({
      id: flowRef.id,
      ...flowData
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating flow:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
    }

    let decodedToken;
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(token);
    } catch (authError) {
      console.error('Firebase token verification failed:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: 'Invalid or expired Firebase token' 
      }, { status: 401 });
    }
    
    // Get organization ID and optional filters
    const organizationId = decodedToken.organizationId || request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const triggerType = searchParams.get('triggerType');
    const isEnabled = searchParams.get('isEnabled');

    // Build query - simplified to avoid index requirements
    const db = getFirestore();
    
    // Get all flows first, then filter in memory to avoid composite index requirement
    const flowsSnapshot = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('flows')
      .get();

    let flows = flowsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      };
    });

    // Apply filters in memory
    if (triggerType) {
      flows = flows.filter(flow => flow.trigger?.type === triggerType);
    }
    
    if (isEnabled !== null) {
      flows = flows.filter(flow => flow.isEnabled === (isEnabled === 'true'));
    }

    // Sort by updatedAt descending
    flows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ flows });

  } catch (error) {
    console.error('Error fetching flows:', error);
    
    // Don't expose internal Firebase errors to frontend
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isAuthError = errorMessage.includes('Firebase') || errorMessage.includes('token') || errorMessage.includes('auth');
    
    return NextResponse.json({ 
      error: isAuthError ? 'Authentication error' : 'Internal server error',
      details: isAuthError ? 'Please log in again' : 'Failed to fetch flows'
    }, { status: isAuthError ? 401 : 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('id');

    if (!organizationId || !flowId) {
      return NextResponse.json({ error: 'Organization ID and flow ID required' }, { status: 400 });
    }

    const updates = await request.json();
    updates.updatedAt = new Date();

    // Update flow in Firestore
    const db = getFirestore();
    const flowRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('flows')
      .doc(flowId);

    await flowRef.update(updates);

    // Get updated flow
    const updatedDoc = await flowRef.get();
    if (!updatedDoc.exists) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    const flowData = updatedDoc.data();
    return NextResponse.json({
      id: updatedDoc.id,
      ...flowData,
      createdAt: flowData.createdAt.toDate(),
      updatedAt: flowData.updatedAt.toDate()
    });

  } catch (error) {
    console.error('Error updating flow:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('id');

    if (!organizationId || !flowId) {
      return NextResponse.json({ error: 'Organization ID and flow ID required' }, { status: 400 });
    }

    // Delete flow from Firestore
    const db = getFirestore();
    await db
      .collection('organizations')
      .doc(organizationId)
      .collection('flows')
      .doc(flowId)
      .delete();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting flow:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}