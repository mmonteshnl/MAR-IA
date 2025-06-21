import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const trackScanSchema = z.object({
  publicUrlId: z.string().min(1, 'Public URL ID is required'),
});

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function parseUserAgent(userAgent: string) {
  const deviceTypes = [
    { name: 'mobile', pattern: /Mobile|Android|iPhone|iPad/i },
    { name: 'tablet', pattern: /iPad|Tablet/i },
    { name: 'desktop', pattern: /./ } // Fallback
  ];

  const browsers = [
    { name: 'Chrome', pattern: /Chrome\/([0-9.]+)/i },
    { name: 'Firefox', pattern: /Firefox\/([0-9.]+)/i },
    { name: 'Safari', pattern: /Safari\/([0-9.]+)/i },
    { name: 'Edge', pattern: /Edge\/([0-9.]+)/i },
    { name: 'Opera', pattern: /Opera\/([0-9.]+)/i },
  ];

  const deviceType = deviceTypes.find(d => d.pattern.test(userAgent))?.name || 'unknown';
  const browser = browsers.find(b => b.pattern.test(userAgent))?.name || 'unknown';

  return { deviceType, browser };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = trackScanSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { publicUrlId } = validationResult.data;
    const db = admin.firestore();

    // Find the QR tracking link
    const qrLinksSnapshot = await db
      .collectionGroup('qr-tracking-links')
      .where('publicUrlId', '==', publicUrlId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (qrLinksSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or inactive tracking link' },
        { status: 404 }
      );
    }

    const qrLinkDoc = qrLinksSnapshot.docs[0];
    const qrLinkData = qrLinkDoc.data();
    const organizationId = qrLinkData.organizationId;

    // Parse request data
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const { deviceType, browser } = parseUserAgent(userAgent);

    // Create scan event record
    const scanEvent = {
      id: nanoid(),
      publicUrlId,
      organizationId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      scanData: {
        ipAddress: clientIP,
        userAgent,
        deviceType,
        browser,
        country: request.headers.get('cf-ipcountry') || 'unknown',
        referrer: request.headers.get('referer') || 'direct',
      }
    };

    // TODO: Migrar a agregador distribuido si el tráfico supera X escrituras/seg
    // For now, we'll use increment() but we should migrate to a distributed aggregator
    // if traffic exceeds high write rates to avoid contention

    // Batch write: save scan event and increment counter
    const batch = db.batch();

    // Save scan event to subcollection
    const scanEventRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .doc(qrLinkDoc.id)
      .collection('scanEvents')
      .doc(scanEvent.id);
    
    batch.set(scanEventRef, scanEvent);

    // Increment scan count
    const qrLinkRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .doc(qrLinkDoc.id);

    batch.update(qrLinkRef, {
      scanCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    console.log(`📱 QR scan tracked: ${scanEvent.id} for link: ${publicUrlId}`);

    return NextResponse.json({
      success: true,
      scanId: scanEvent.id
    });

  } catch (error) {
    console.error('Error tracking QR scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}