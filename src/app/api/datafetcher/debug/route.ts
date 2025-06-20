import { NextRequest, NextResponse } from 'next/server';
import { firebaseDataService } from '@/lib/firebase-data-service';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { collection, organizationId, userId } = await request.json();

    console.log('🔍 DEBUG DataFetcher:', {
      collection,
      organizationId,
      userId,
      timestamp: new Date().toISOString()
    });

    // Verificar conexión básica a Firestore
    let basicConnectionTest;
    try {
      const testDoc = await db.collection('test').limit(1).get();
      basicConnectionTest = {
        success: true,
        canConnect: true,
        docsFound: testDoc.size
      };
    } catch (error) {
      basicConnectionTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Probar la colección específica
    let collectionTest;
    try {
      if (collection) {
        let query = db.collection(collection);
        
        // Aplicar filtros si es necesario
        if (organizationId) {
          query = query.where('organizationId', '==', organizationId);
        }
        
        const snapshot = await query.limit(1).get();
        collectionTest = {
          success: true,
          exists: !snapshot.empty,
          collectionPath: collection,
          docsFound: snapshot.size,
          sampleDoc: snapshot.empty ? null : {
            id: snapshot.docs[0].id,
            data: snapshot.docs[0].data()
          }
        };
      }
    } catch (error) {
      collectionTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Probar el servicio DataFetcher
    let dataFetcherTest;
    try {
      if (collection) {
        const result = await firebaseDataService.testConnection(collection, {
          organizationId,
          userId,
          limit: 1
        });
        dataFetcherTest = result;
      }
    } catch (error) {
      dataFetcherTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        projectId: process.env.FIREBASE_PROJECT_ID,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        basicConnectionTest,
        collectionTest,
        dataFetcherTest,
        requestParams: {
          collection,
          organizationId,
          userId
        }
      }
    });

  } catch (error) {
    console.error('❌ DEBUG DataFetcher Error:', error);
    return NextResponse.json(
      { 
        debug: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}