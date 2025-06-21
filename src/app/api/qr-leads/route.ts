import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import { admin } from '@/lib/firebase-admin';

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
    
    // Get all QR tracking links for this organization
    const qrLinksSnapshot = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .get();

    const qrLeads: any[] = [];
    
    // For each QR link, get its public leads
    for (const qrLinkDoc of qrLinksSnapshot.docs) {
      const qrLinkData = qrLinkDoc.data();
      
      const publicLeadsSnapshot = await db
        .collection('organizations')
        .doc(organizationId)
        .collection('qr-tracking-links')
        .doc(qrLinkDoc.id)
        .collection('publicLeads')
        .orderBy('createdAt', 'desc')
        .get();

      for (const leadDoc of publicLeadsSnapshot.docs) {
        const leadData = leadDoc.data();
        
        // Transform to unified lead format
        const unifiedLead = {
          id: leadDoc.id,
          name: leadData.leadData.name,
          email: leadData.leadData.email,
          phone: leadData.leadData.phone,
          company: '', // QR leads don't typically have company info
          source: 'qr-leads',
          status: leadData.status,
          createdAt: leadData.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          transferredToFlow: leadData.status === 'promoted',
          metadata: {
            qrLinkName: qrLinkData.name,
            qrLinkId: qrLinkDoc.id,
            publicUrlId: qrLinkData.publicUrlId,
            notes: leadData.leadData.notes,
            ipAddress: leadData.ipAddress,
            userAgent: leadData.userAgent,
            deviceType: leadData.metadata?.deviceType,
            browser: leadData.metadata?.browser,
            country: leadData.metadata?.country,
            promotedAt: leadData.metadata?.promotedAt?.toDate()?.toISOString(),
            promotedBy: leadData.metadata?.promotedBy,
            promotedToLeadId: leadData.metadata?.promotedToLeadId
          }
        };

        qrLeads.push(unifiedLead);
      }
    }

    // Calculate stats
    const total = qrLeads.length;
    const transferred = qrLeads.filter(lead => lead.transferredToFlow).length;
    const pending = total - transferred;

    return NextResponse.json({
      success: true,
      leads: qrLeads,
      stats: {
        source: 'qr-leads',
        total,
        pending,
        transferred,
        isActive: total > 0
      }
    });

  } catch (error) {
    console.error('Error fetching QR leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, organizationId, qrLinkId } = body;

    if (!leadId || !organizationId || !qrLinkId) {
      return NextResponse.json(
        { error: 'leadId, organizationId, and qrLinkId are required' },
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

    // Get the lead data
    const leadDoc = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .doc(qrLinkId)
      .collection('publicLeads')
      .doc(leadId)
      .get();

    if (!leadDoc.exists) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const leadData = leadDoc.data();
    if (leadData?.status === 'promoted') {
      return NextResponse.json(
        { error: 'Lead already promoted' },
        { status: 400 }
      );
    }

    // Create a new lead in the leads-flow collection
    const newLeadId = `qr_${leadId}_${Date.now()}`;
    const leadToPromote = {
      id: newLeadId,
      fullName: leadData?.leadData.name,
      email: leadData?.leadData.email,
      phoneNumber: leadData?.leadData.phone,
      companyName: '',
      notes: leadData?.leadData.notes || '',
      source: 'QR Code',
      stage: 'Nuevo',
      status: 'active',
      priority: 'medium',
      organizationId,
      createdBy: authResult.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        originalSource: 'qr-leads',
        qrLinkId,
        originalLeadId: leadId,
        promotedAt: admin.firestore.FieldValue.serverTimestamp(),
        promotedBy: authResult.user.uid,
        ipAddress: leadData?.ipAddress,
        userAgent: leadData?.userAgent,
        deviceType: leadData?.metadata?.deviceType,
        browser: leadData?.metadata?.browser,
        country: leadData?.metadata?.country
      }
    };

    // Batch operation: create new lead and update original
    const batch = db.batch();

    // Add to leads-flow
    const newLeadRef = db.collection('leads-flow').doc(newLeadId);
    batch.set(newLeadRef, leadToPromote);

    // Update original lead status
    const originalLeadRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('qr-tracking-links')
      .doc(qrLinkId)
      .collection('publicLeads')
      .doc(leadId);

    batch.update(originalLeadRef, {
      status: 'promoted',
      'metadata.promotedAt': admin.firestore.FieldValue.serverTimestamp(),
      'metadata.promotedBy': authResult.user.uid,
      'metadata.promotedToLeadId': newLeadId
    });

    await batch.commit();

    console.log(`✅ QR lead promoted: ${leadId} -> ${newLeadId}`);

    return NextResponse.json({
      success: true,
      newLeadId,
      message: 'Lead promoted successfully'
    });

  } catch (error) {
    console.error('Error promoting QR lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}