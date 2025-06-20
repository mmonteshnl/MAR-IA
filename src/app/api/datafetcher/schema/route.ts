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

    const schema = await firebaseDataService.getCollectionSchema(collection, {
      organizationId,
      userId
    });

    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error getting collection schema:', error);
    return NextResponse.json(
      { 
        fields: [],
        sampleValues: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}