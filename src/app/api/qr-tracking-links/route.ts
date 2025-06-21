import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import { admin } from '@/lib/firebase-admin';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

interface CreateQRTrackingLinkRequest {
  organizationId: string;
  name: string;
  description: string;
  metadata?: {
    targetAudience?: string;
    expectedLeads?: number;
    notes?: string;
  };
}

interface UpdateQRTrackingLinkRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  metadata?: {
    targetAudience?: string;
    expectedLeads?: number;
    notes?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body: CreateQRTrackingLinkRequest = await request.json();
    const { organizationId, name, description, metadata } = body;

    if (!organizationId || !name || !description) {
      return NextResponse.json(
        { error: 'organizationId, name, and description are required' },
        { status: 400 }
      );
    }

    if (authResult.user.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'No access to this organization' },
        { status: 403 }
      );
    }

    const db = admin.firestore();
    
    // Generate cryptographically secure short ID for public URL
    let publicUrlId: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure publicUrlId is unique
    do {
      publicUrlId = nanoid(8); // 8 characters for good balance of security and usability
      
      const existingDoc = await db
        .collection('organizations')
        .doc(organizationId)
        .collection('qr-tracking-links')
        .where('publicUrlId', '==', publicUrlId)
        .limit(1)
        .get();
        
      isUnique = existingDoc.empty;
      attempts++;
    } while (!isUnique && attempts < maxAttempts);

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique public URL ID' },
        { status: 500 }
      );
    }

    // Generate QR code
    const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/qr/${publicUrlId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'H',
      width: 256,
      margin: 2,
    });

    const qrTrackingLink = {
      id: nanoid(),
      organizationId,
      name,
      description,
      publicUrlId,
      scanCount: 0,
      submissionCount: 0,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: authResult.user.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        qrCodeDataUrl,
        targetAudience: metadata?.targetAudience,
        expectedLeads: metadata?.expectedLeads,
        notes: metadata?.notes,
      }
    };

    await db
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .doc(qrTrackingLink.id)
      .set(qrTrackingLink);

    console.log(`✅ QR tracking link created: ${qrTrackingLink.id} with public URL: ${publicUrlId}`);

    return NextResponse.json({
      success: true,
      id: qrTrackingLink.id,
      publicUrlId,
      publicUrl,
      qrCodeDataUrl,
      name,
      description
    });

  } catch (error) {
    console.error('Error creating QR tracking link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (authResult.user.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'No access to this organization' },
        { status: 403 }
      );
    }

    const db = admin.firestore();
    
    const snapshot = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .orderBy('createdAt', 'desc')
      .get();

    const qrTrackingLinks = snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      qrTrackingLinks,
      total: qrTrackingLinks.length
    });

  } catch (error) {
    console.error('Error fetching QR tracking links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');
    const organizationId = searchParams.get('organizationId');

    if (!linkId || !organizationId) {
      return NextResponse.json(
        { error: 'id and organizationId are required' },
        { status: 400 }
      );
    }

    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (authResult.user.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'No access to this organization' },
        { status: 403 }
      );
    }

    const body: UpdateQRTrackingLinkRequest = await request.json();
    const { name, description, isActive, metadata } = body;

    const db = admin.firestore();
    const linkRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .doc(linkId);

    const linkDoc = await linkRef.get();
    if (!linkDoc.exists) {
      return NextResponse.json(
        { error: 'QR tracking link not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (metadata !== undefined) {
      updateData.metadata = {
        ...linkDoc.data()?.metadata,
        ...metadata
      };
    }

    await linkRef.update(updateData);

    console.log(`✅ QR tracking link updated: ${linkId}`);

    return NextResponse.json({
      success: true,
      id: linkId,
      updated: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });

  } catch (error) {
    console.error('Error updating QR tracking link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}