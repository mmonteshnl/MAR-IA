import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Missing authorization header',
        hasHeader: !!authHeader,
        headerStart: authHeader?.substring(0, 20)
      }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json({ 
        error: 'No token found',
        tokenLength: 0
      }, { status: 401 });
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified
      },
      organizationId: decodedToken.organizationId || request.headers.get('x-organization-id'),
      tokenInfo: {
        iss: decodedToken.iss,
        aud: decodedToken.aud,
        exp: decodedToken.exp,
        iat: decodedToken.iat
      }
    });

  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({ 
      error: 'Token verification failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name
    }, { status: 401 });
  }
}