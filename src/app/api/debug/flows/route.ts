import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Missing authorization header',
        debug: { hasHeader: !!authHeader }
      }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    let decodedToken;
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(token);
    } catch (authError) {
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError instanceof Error ? authError.message : 'Unknown auth error'
      }, { status: 401 });
    }
    
    const organizationId = decodedToken.organizationId || request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Get all flows without filters for debugging
    const db = getFirestore();
    const flowsSnapshot = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('flows')
      .orderBy('updatedAt', 'desc')
      .get();

    const flows = flowsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        triggerType: data.trigger?.type,
        isEnabled: data.isEnabled,
        hasAlias: !!data.alias,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt
      };
    });

    // Count manual flows specifically
    const manualFlows = flows.filter(f => f.triggerType === 'manual_lead_action' && f.isEnabled);

    return NextResponse.json({ 
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email
      },
      organizationId,
      totalFlows: flows.length,
      manualFlows: manualFlows.length,
      flows,
      debug: {
        timestamp: new Date().toISOString(),
        filters: {
          triggerType: 'manual_lead_action',
          isEnabled: true
        }
      }
    });

  } catch (error) {
    console.error('Debug flows error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}