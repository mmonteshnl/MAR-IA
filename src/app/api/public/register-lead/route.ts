import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { nanoid } from 'nanoid';
import { z } from 'zod';

// Rate limiting storage (in production, use Redis or proper rate limiting service)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per hour per IP

// Validation schema with honeypot
const registerLeadSchema = z.object({
  publicUrlId: z.string().min(1, 'Public URL ID is required'),
  leadData: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(8, 'Phone must be at least 8 characters').max(20, 'Phone too long'),
    notes: z.string().max(500, 'Notes too long').optional(),
  }),
  // Honeypot field - should be empty for legitimate users
  website: z.string().max(0, 'Invalid form submission').optional(),
});

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rateLimitData = rateLimitMap.get(ip);

  if (!rateLimitData) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (now > rateLimitData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  rateLimitData.count++;
  return false;
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
    const clientIP = getClientIP(request);
    
    // Rate limiting check
    if (isRateLimited(clientIP)) {
      console.log(`🚫 Rate limited IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input with zod
    const validationResult = registerLeadSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.errors);
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }

    const { publicUrlId, leadData, website } = validationResult.data;

    // Honeypot check - if website field has any value, it's likely a bot
    if (website && website.length > 0) {
      console.log(`🍯 Honeypot triggered for IP: ${clientIP}, website field: "${website}"`);
      // Return success to not reveal the honeypot to bots
      return NextResponse.json({ success: true });
    }

    const db = admin.firestore();
    
    // Verify that the QR tracking link exists and is active
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

    // Parse user agent
    const userAgent = request.headers.get('user-agent') || '';
    const { deviceType, browser } = parseUserAgent(userAgent);

    // Create public lead record
    const publicLead = {
      id: nanoid(),
      leadData,
      status: 'pending_promotion',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: clientIP,
      userAgent,
      metadata: {
        deviceType,
        browser,
        country: request.headers.get('cf-ipcountry') || 'unknown',
        referrer: request.headers.get('referer') || 'direct',
      }
    };

    // Save to the QR tracking link's subcollection
    await db
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .doc(qrLinkDoc.id)
      .collection('publicLeads')
      .doc(publicLead.id)
      .set(publicLead);

    // Increment submission count
    await db
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .doc(qrLinkDoc.id)
      .update({
        submissionCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log(`✅ Public lead registered: ${publicLead.id} for QR link: ${publicUrlId}`);

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your information has been received.'
    });

  } catch (error) {
    console.error('Error registering public lead:', error);
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