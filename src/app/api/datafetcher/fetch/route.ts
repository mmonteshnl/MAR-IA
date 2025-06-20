import { NextRequest, NextResponse } from 'next/server';
import { firebaseDataService } from '@/lib/firebase-data-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      collection,
      fetchMode = 'all',
      targetId,
      organizationId,
      userId,
      filters = {},
      limit = 10,
      offset = 0,
      orderBy
    } = await request.json();

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection is required' },
        { status: 400 }
      );
    }

    let result;

    switch (fetchMode) {
      case 'byId':
        if (!targetId) {
          return NextResponse.json(
            { error: 'Target ID is required for byId mode' },
            { status: 400 }
          );
        }
        
        const singleDoc = await firebaseDataService.fetchById(collection, targetId, {
          organizationId,
          userId
        });
        
        result = {
          data: singleDoc ? [singleDoc] : [],
          total: singleDoc ? 1 : 0,
          hasMore: false,
          metadata: {
            collection,
            executionTime: 0,
            filters: {}
          }
        };
        break;

      case 'all':
      case 'byRange':
      default:
        result = await firebaseDataService.fetchData(collection, {
          organizationId,
          userId,
          filters,
          limit,
          offset,
          orderBy
        });
        break;
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}