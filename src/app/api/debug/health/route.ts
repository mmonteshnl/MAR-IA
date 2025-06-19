import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Test Firebase Admin connection
    const db = getFirestore();
    
    // Try to read a simple document to test connectivity
    const testDoc = await db.collection('test').limit(1).get();
    
    return NextResponse.json({
      status: 'healthy',
      firebase: 'connected',
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        projectId: process.env.FIREBASE_PROJECT_ID,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}