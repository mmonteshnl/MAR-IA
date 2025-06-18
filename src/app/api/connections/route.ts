import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { encrypt, decrypt } from '@/lib/secure-crypto';
import { CreateConnectionRequest, Connection } from '@/types/conex';
import { firebaseAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get organization ID from custom claims or request
    const organizationId = decodedToken.organizationId || request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const body: CreateConnectionRequest = await request.json();
    const { name, type, authType, credentials } = body;

    // Validate required fields
    if (!name || !type || !authType || !credentials) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Encrypt credentials
    const encryptedCredentials = encrypt(JSON.stringify(credentials));

    // Create connection document
    const db = getFirestore();
    const connectionRef = db.collection('organizations').doc(organizationId).collection('connections').doc();
    
    const connectionData: Omit<Connection, 'id'> = {
      name,
      type,
      authType,
      credentials: encryptedCredentials,
      createdAt: new Date(),
      createdBy: userId,
      organizationId
    };

    await connectionRef.set(connectionData);

    // Return connection without credentials
    const { credentials: _, ...safeConnectionData } = connectionData;
    return NextResponse.json({
      id: connectionRef.id,
      ...safeConnectionData
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating connection:', error);
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
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get organization ID
    const organizationId = decodedToken.organizationId || request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Get connections from Firestore
    const db = getFirestore();
    const connectionsSnapshot = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('connections')
      .orderBy('createdAt', 'desc')
      .get();

    const connections = connectionsSnapshot.docs.map(doc => {
      const data = doc.data();
      // Exclude credentials from response for security
      const { credentials, ...safeData } = data;
      return {
        id: doc.id,
        ...safeData,
        createdAt: data.createdAt.toDate()
      };
    });

    return NextResponse.json({ connections });

  } catch (error) {
    console.error('Error fetching connections:', error);
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
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get organization ID and connection ID
    const organizationId = decodedToken.organizationId || request.headers.get('x-organization-id');
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!organizationId || !connectionId) {
      return NextResponse.json({ error: 'Organization ID and connection ID required' }, { status: 400 });
    }

    // Delete connection from Firestore
    const db = getFirestore();
    await db
      .collection('organizations')
      .doc(organizationId)
      .collection('connections')
      .doc(connectionId)
      .delete();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}