import { NextRequest, NextResponse } from 'next/server';
import { firebaseDataService } from '@/lib/firebase-data-service';

export async function POST(request: NextRequest) {
  try {
    const { collection, organizationId, userId } = await request.json();

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection is required' },
        { status: 400 }
      );
    }

    const result = await firebaseDataService.testConnection(collection, {
      organizationId,
      userId,
      limit: 3
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing Firebase connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sampleData: [],
        totalCount: 0
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const collections = firebaseDataService.getAvailableCollections();
    return NextResponse.json(collections);
  } catch (error) {
    console.error('Error getting collections:', error);
    return NextResponse.json(
      { error: 'Failed to get collections' },
      { status: 500 }
    );
  }
}