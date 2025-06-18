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
    const { name, description, icon, trigger, definition, isEnabled = true } = body;

    // Validate required fields
    if (!name || !description || !icon || !trigger || !definition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get organization ID and optional filters
    const organizationId = decodedToken.organizationId || request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const triggerType = searchParams.get('triggerType');
    const isEnabled = searchParams.get('isEnabled');

    // Build query
    const db = getFirestore();
    let query = db
      .collection('organizations')
      .doc(organizationId)
      .collection('flows')
      .orderBy('updatedAt', 'desc');

    // Apply filters
    if (triggerType) {
      query = query.where('trigger.type', '==', triggerType);
    }
    
    if (isEnabled !== null) {
      query = query.where('isEnabled', '==', isEnabled === 'true');
    }

    const flowsSnapshot = await query.get();

    const flows = flowsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
    });

    return NextResponse.json({ flows });

  } catch (error) {
    console.error('Error fetching flows:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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