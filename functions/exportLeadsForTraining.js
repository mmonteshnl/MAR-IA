/**
 * Cloud Function: Export Leads for ML Training
 * 
 * This function exports historical leads data from Firestore to Google Cloud Storage
 * in CSV format for machine learning model training with Vertex AI AutoML.
 * 
 * Triggered by: Cloud Scheduler (weekly) or HTTP request
 * Output: CSV file in GCS bucket with engineered features for ML training
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const { Parser } = require('json2csv');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = new Storage();

// Configuration
const CONFIG = {
  // GCS Bucket for ML datasets
  ML_BUCKET: process.env.ML_TRAINING_BUCKET || 'mar-ia-ml-training',
  
  // Minimum number of leads required for training
  MIN_TRAINING_SAMPLES: 100,
  
  // Features to extract for ML model
  FEATURES: [
    'leadSource',
    'leadIndustry', 
    'leadValue',
    'leadUrgency',
    'companySize',
    'contactMethod',
    'initialResponseTime',
    'followUpCount',
    'daysInPipeline',
    'finalOutcome'
  ],
  
  // Final outcomes for supervised learning
  FINAL_OUTCOMES: ['Ganado', 'Perdido'],
  
  // Lead sources to include
  VALID_SOURCES: ['META_ADS', 'GOOGLE_ADS', 'WEBSITE', 'REFERRAL', 'COLD_OUTREACH']
};

/**
 * Feature Engineering: Extract ML features from lead data
 */
function extractFeatures(lead) {
  const features = {};
  
  // Basic lead information
  features.leadSource = lead.source || 'UNKNOWN';
  features.leadIndustry = lead.industry || 'UNKNOWN';
  features.leadValue = parseFloat(lead.estimatedValue) || 0;
  features.leadUrgency = lead.urgency || 'medium';
  
  // Company characteristics
  features.companySize = lead.companySize || 'unknown';
  features.contactMethod = lead.preferredContactMethod || 'email';
  
  // Engagement metrics
  features.initialResponseTime = calculateResponseTime(lead.createdAt, lead.firstContact);
  features.followUpCount = lead.interactions ? lead.interactions.length : 0;
  features.daysInPipeline = calculateDaysInPipeline(lead.createdAt, lead.updatedAt);
  
  // Communication preferences
  features.hasPhone = lead.phone ? 1 : 0;
  features.hasEmail = lead.email ? 1 : 0;
  features.hasWhatsApp = lead.whatsapp ? 1 : 0;
  
  // Lead scoring factors
  features.budgetQualified = lead.budgetQualified ? 1 : 0;
  features.authorityConfirmed = lead.authorityConfirmed ? 1 : 0;
  features.needIdentified = lead.needIdentified ? 1 : 0;
  features.timelineEstablished = lead.timelineEstablished ? 1 : 0;
  
  // Derived features
  features.leadScore = calculateLeadScore(features);
  features.engagementLevel = calculateEngagementLevel(features);
  
  // Target variable (for supervised learning)
  features.finalOutcome = lead.stage || lead.status || 'UNKNOWN';
  
  return features;
}

/**
 * Calculate response time in hours
 */
function calculateResponseTime(createdAt, firstContact) {
  if (!createdAt || !firstContact) return -1;
  
  const created = new Date(createdAt.toDate ? createdAt.toDate() : createdAt);
  const contacted = new Date(firstContact.toDate ? firstContact.toDate() : firstContact);
  
  return Math.round((contacted - created) / (1000 * 60 * 60)); // hours
}

/**
 * Calculate days in pipeline
 */
function calculateDaysInPipeline(createdAt, updatedAt) {
  if (!createdAt) return 0;
  
  const created = new Date(createdAt.toDate ? createdAt.toDate() : createdAt);
  const updated = updatedAt ? 
    new Date(updatedAt.toDate ? updatedAt.toDate() : updatedAt) : 
    new Date();
  
  return Math.round((updated - created) / (1000 * 60 * 60 * 24)); // days
}

/**
 * Calculate lead score based on features
 */
function calculateLeadScore(features) {
  let score = 0;
  
  // Value-based scoring
  if (features.leadValue > 50000) score += 40;
  else if (features.leadValue > 25000) score += 30;
  else if (features.leadValue > 10000) score += 20;
  else if (features.leadValue > 5000) score += 10;
  
  // Urgency scoring
  if (features.leadUrgency === 'high') score += 20;
  else if (features.leadUrgency === 'medium') score += 10;
  
  // BANT qualification
  score += (features.budgetQualified * 10);
  score += (features.authorityConfirmed * 10);
  score += (features.needIdentified * 10);
  score += (features.timelineEstablished * 10);
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Calculate engagement level
 */
function calculateEngagementLevel(features) {
  if (features.followUpCount >= 5) return 'high';
  if (features.followUpCount >= 2) return 'medium';
  return 'low';
}

/**
 * Validate and clean lead data
 */
function validateLead(lead) {
  // Must have final outcome for supervised learning
  if (!CONFIG.FINAL_OUTCOMES.includes(lead.stage) && 
      !CONFIG.FINAL_OUTCOMES.includes(lead.status)) {
    return false;
  }
  
  // Must have basic required fields
  if (!lead.email && !lead.phone) {
    return false;
  }
  
  // Must have creation date
  if (!lead.createdAt) {
    return false;
  }
  
  return true;
}

/**
 * Export leads data to CSV format
 */
async function exportLeadsToCSV(organizationId) {
  console.log(`Starting ML data export for organization: ${organizationId}`);
  
  try {
    // Query leads from unified collection
    const leadsQuery = db.collection('leads-unified')
      .where('organizationId', '==', organizationId)
      .where('stage', 'in', CONFIG.FINAL_OUTCOMES);
    
    const snapshot = await leadsQuery.get();
    
    if (snapshot.empty) {
      throw new Error('No leads found with final outcomes for training');
    }
    
    console.log(`Found ${snapshot.size} leads with final outcomes`);
    
    // Process leads and extract features
    const processedLeads = [];
    let validLeads = 0;
    
    snapshot.forEach(doc => {
      const lead = { id: doc.id, ...doc.data() };
      
      if (validateLead(lead)) {
        const features = extractFeatures(lead);
        processedLeads.push(features);
        validLeads++;
      }
    });
    
    console.log(`Processed ${validLeads} valid leads for training`);
    
    if (validLeads < CONFIG.MIN_TRAINING_SAMPLES) {
      throw new Error(`Insufficient training data: ${validLeads} leads (minimum: ${CONFIG.MIN_TRAINING_SAMPLES})`);
    }
    
    // Convert to CSV
    const fields = Object.keys(processedLeads[0]);
    const json2csvParser = new Parser({ fields });
    const csvData = json2csvParser.parse(processedLeads);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `training-data-${organizationId}-${timestamp}.csv`;
    
    // Upload to Cloud Storage
    const bucket = storage.bucket(CONFIG.ML_BUCKET);
    const file = bucket.file(`training-datasets/${filename}`);
    
    await file.save(csvData, {
      metadata: {
        contentType: 'text/csv',
        metadata: {
          organizationId,
          recordCount: validLeads.toString(),
          generatedAt: new Date().toISOString(),
          version: '1.0'
        }
      }
    });
    
    console.log(`Successfully exported ${validLeads} leads to ${filename}`);
    
    // Log export event
    await db.collection('ml-exports').add({
      organizationId,
      filename,
      recordCount: validLeads,
      featuresCount: fields.length,
      exportedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed',
      bucketPath: `gs://${CONFIG.ML_BUCKET}/training-datasets/${filename}`
    });
    
    return {
      success: true,
      filename,
      recordCount: validLeads,
      featuresCount: fields.length,
      bucketPath: `gs://${CONFIG.ML_BUCKET}/training-datasets/${filename}`,
      message: `Successfully exported ${validLeads} leads for ML training`
    };
    
  } catch (error) {
    console.error('Error exporting leads for training:', error);
    
    // Log error
    await db.collection('ml-exports').add({
      organizationId,
      status: 'failed',
      error: error.message,
      exportedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw error;
  }
}

/**
 * HTTP Cloud Function - Export Leads for Training
 */
exports.exportLeadsForTraining = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Validate request
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { organizationId } = req.body;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }
    
    // Verify authentication (you may want to add JWT validation here)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Export leads
    const result = await exportLeadsToCSV(organizationId);
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Function error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Scheduled Cloud Function - Weekly Training Data Export
 */
exports.scheduledMLExport = functions.pubsub
  .schedule('0 2 * * 1') // Every Monday at 2 AM
  .timeZone('America/Mexico_City')
  .onRun(async (context) => {
    console.log('Starting scheduled ML data export for all organizations');
    
    try {
      // Get all organizations
      const orgsSnapshot = await db.collection('organizations').get();
      
      if (orgsSnapshot.empty) {
        console.log('No organizations found');
        return;
      }
      
      const results = [];
      
      // Export for each organization
      for (const orgDoc of orgsSnapshot.docs) {
        const orgId = orgDoc.id;
        
        try {
          const result = await exportLeadsToCSV(orgId);
          results.push({ organizationId: orgId, ...result });
          console.log(`✅ Export completed for organization: ${orgId}`);
        } catch (error) {
          console.error(`❌ Export failed for organization: ${orgId}`, error);
          results.push({
            organizationId: orgId,
            success: false,
            error: error.message
          });
        }
      }
      
      console.log(`Scheduled export completed for ${results.length} organizations`);
      console.log('Results:', results);
      
    } catch (error) {
      console.error('Scheduled export failed:', error);
      throw error;
    }
  });

/**
 * Utility: Get ML Export Status
 */
exports.getMLExportStatus = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const { organizationId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }
    
    // Get recent exports
    const exportsSnapshot = await db.collection('ml-exports')
      .where('organizationId', '==', organizationId)
      .orderBy('exportedAt', 'desc')
      .limit(10)
      .get();
    
    const exports = [];
    exportsSnapshot.forEach(doc => {
      exports.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json({
      organizationId,
      recentExports: exports,
      lastExport: exports[0] || null,
      totalExports: exports.length
    });
    
  } catch (error) {
    console.error('Error getting export status:', error);
    res.status(500).json({ error: error.message });
  }
});