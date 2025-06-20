/**
 * Cloud Function: Get Lead Prediction
 * 
 * This function provides real-time lead predictions using the trained
 * Vertex AI AutoML model. It processes incoming lead data, extracts features,
 * and returns success probability with recommended actions.
 * 
 * Triggered by: HTTP request from the Mar-IA application
 * Output: Prediction score, probability, and recommended actions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { PredictionServiceClient } = require('@google-cloud/aiplatform');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Configuration
const CONFIG = {
  // Vertex AI Configuration
  PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT,
  LOCATION: process.env.VERTEX_AI_REGION || 'us-central1',
  ENDPOINT_ID: process.env.VERTEX_AI_ENDPOINT,
  
  // Model Configuration
  MODEL_NAME: process.env.MODEL_DISPLAY_NAME || 'lead-prediction-model',
  
  // Prediction thresholds
  HIGH_PROBABILITY_THRESHOLD: 0.75,
  MEDIUM_PROBABILITY_THRESHOLD: 0.50,
  
  // Action recommendations configuration
  ACTIONS: {
    AI_CALL: {
      name: 'AI Call',
      description: 'Llamada automatizada con IA conversacional',
      boost: 0.15,
      priority: 'high',
      timeframe: 'immediate'
    },
    HUMAN_CALL: {
      name: 'Human Call', 
      description: 'Llamada personal del equipo de ventas',
      boost: 0.20,
      priority: 'high',
      timeframe: '2-4 hours'
    },
    WHATSAPP_SEQUENCE: {
      name: 'WhatsApp Sequence',
      description: 'Secuencia de mensajes automatizada',
      boost: 0.10,
      priority: 'medium',
      timeframe: '1-2 hours'
    },
    EMAIL_NURTURE: {
      name: 'Email Nurture',
      description: 'Secuencia de emails personalizados',
      boost: 0.08,
      priority: 'medium',
      timeframe: '24 hours'
    },
    PRIORITY_FOLLOW_UP: {
      name: 'Priority Follow-up',
      description: 'Seguimiento prioritario manual',
      boost: 0.12,
      priority: 'high',
      timeframe: '4-8 hours'
    }
  }
};

/**
 * Feature extraction (matching training data format)
 */
function extractPredictionFeatures(leadData) {
  const features = {};
  
  // Basic lead information
  features.leadSource = leadData.source || 'UNKNOWN';
  features.leadIndustry = leadData.industry || 'UNKNOWN';
  features.leadValue = parseFloat(leadData.estimatedValue) || 0;
  features.leadUrgency = leadData.urgency || 'medium';
  
  // Company characteristics
  features.companySize = leadData.companySize || 'unknown';
  features.contactMethod = leadData.preferredContactMethod || 'email';
  
  // Engagement metrics (for new leads, use defaults)
  features.initialResponseTime = -1; // Not yet contacted
  features.followUpCount = 0;
  features.daysInPipeline = 0;
  
  // Communication preferences
  features.hasPhone = leadData.phone ? 1 : 0;
  features.hasEmail = leadData.email ? 1 : 0;
  features.hasWhatsApp = leadData.whatsapp ? 1 : 0;
  
  // Lead scoring factors (from lead qualification)
  features.budgetQualified = leadData.budgetQualified ? 1 : 0;
  features.authorityConfirmed = leadData.authorityConfirmed ? 1 : 0;
  features.needIdentified = leadData.needIdentified ? 1 : 0;
  features.timelineEstablished = leadData.timelineEstablished ? 1 : 0;
  
  // Derived features
  features.leadScore = calculateLeadScore(features);
  features.engagementLevel = 'low'; // New lead
  
  return features;
}

/**
 * Calculate lead score (same logic as training)
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
  
  return Math.min(score, 100);
}

/**
 * Get prediction from Vertex AI model
 */
async function getPredictionFromModel(features) {
  try {
    const client = new PredictionServiceClient();
    
    // Prepare the prediction request
    const endpoint = `projects/${CONFIG.PROJECT_ID}/locations/${CONFIG.LOCATION}/endpoints/${CONFIG.ENDPOINT_ID}`;
    
    // Convert features to the format expected by the model
    const instances = [Object.values(features)];
    
    const request = {
      endpoint,
      instances
    };
    
    console.log('Requesting prediction from Vertex AI:', { endpoint, featuresCount: instances[0].length });
    
    // Make prediction request
    const [response] = await client.predict(request);
    
    if (!response.predictions || response.predictions.length === 0) {
      throw new Error('No predictions returned from model');
    }
    
    const prediction = response.predictions[0];
    
    // Extract prediction results (format depends on model type)
    let probability;
    let predictedClass;
    
    if (prediction.scores) {
      // Classification model with scores
      const scores = prediction.scores;
      const classes = prediction.classes || ['Perdido', 'Ganado'];
      
      // Find the index of 'Ganado' (won) class
      const ganadoIndex = classes.indexOf('Ganado');
      probability = ganadoIndex >= 0 ? scores[ganadoIndex] : scores[1] || 0;
      predictedClass = probability > 0.5 ? 'Ganado' : 'Perdido';
    } else if (prediction.value !== undefined) {
      // Regression model returning probability directly
      probability = Math.max(0, Math.min(1, prediction.value));
      predictedClass = probability > 0.5 ? 'Ganado' : 'Perdido';
    } else {
      // Fallback: try to extract from prediction structure
      probability = prediction.probability || prediction.confidence || 0.5;
      predictedClass = prediction.predicted_label || (probability > 0.5 ? 'Ganado' : 'Perdido');
    }
    
    return {
      probability,
      predictedClass,
      confidence: Math.abs(probability - 0.5) * 2, // Confidence from 0 to 1
      modelVersion: response.modelVersionId || 'unknown',
      predictionTime: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error getting prediction from Vertex AI:', error);
    
    // Fallback to rule-based prediction if model is unavailable
    console.log('Using fallback rule-based prediction');
    return getRuleBasedPrediction(features);
  }
}

/**
 * Fallback rule-based prediction
 */
function getRuleBasedPrediction(features) {
  let score = features.leadScore;
  
  // Additional rules for probability calculation
  if (features.leadValue > 25000) score += 10;
  if (features.leadUrgency === 'high') score += 15;
  if (features.hasPhone && features.hasEmail) score += 5;
  
  // Convert score to probability (0-1)
  const probability = Math.min(1, Math.max(0, score / 100));
  
  return {
    probability,
    predictedClass: probability > 0.5 ? 'Ganado' : 'Perdido',
    confidence: Math.abs(probability - 0.5) * 2,
    modelVersion: 'rule-based-fallback',
    predictionTime: new Date().toISOString()
  };
}

/**
 * Generate recommended actions based on prediction and lead characteristics
 */
function generateRecommendedActions(leadData, prediction, features) {
  const recommendations = [];
  const baseProbability = prediction.probability;
  
  // Analyze lead characteristics to determine best actions
  const hasPhone = features.hasPhone;
  const hasWhatsApp = features.hasWhatsApp;
  const isHighValue = features.leadValue > 25000;
  const isUrgent = features.leadUrgency === 'high';
  
  // AI Call recommendation
  if (hasPhone && (isHighValue || isUrgent)) {
    const newProbability = Math.min(1, baseProbability + CONFIG.ACTIONS.AI_CALL.boost);
    recommendations.push({
      action: 'AI_CALL',
      ...CONFIG.ACTIONS.AI_CALL,
      currentProbability: Math.round(baseProbability * 100),
      newProbability: Math.round(newProbability * 100),
      probabilityIncrease: Math.round((newProbability - baseProbability) * 100),
      reasoning: isHighValue ? 
        'Alto valor del lead justifica contacto inmediato por voz' :
        'Urgencia alta requiere respuesta rápida y personal'
    });
  }
  
  // Human Call for very high value leads
  if (hasPhone && features.leadValue > 50000) {
    const newProbability = Math.min(1, baseProbability + CONFIG.ACTIONS.HUMAN_CALL.boost);
    recommendations.push({
      action: 'HUMAN_CALL',
      ...CONFIG.ACTIONS.HUMAN_CALL,
      currentProbability: Math.round(baseProbability * 100),
      newProbability: Math.round(newProbability * 100),
      probabilityIncrease: Math.round((newProbability - baseProbability) * 100),
      reasoning: 'Lead de muy alto valor requiere atención personal especializada'
    });
  }
  
  // WhatsApp sequence for leads with WhatsApp
  if (hasWhatsApp) {
    const newProbability = Math.min(1, baseProbability + CONFIG.ACTIONS.WHATSAPP_SEQUENCE.boost);
    recommendations.push({
      action: 'WHATSAPP_SEQUENCE',
      ...CONFIG.ACTIONS.WHATSAPP_SEQUENCE,
      currentProbability: Math.round(baseProbability * 100),
      newProbability: Math.round(newProbability * 100),
      probabilityIncrease: Math.round((newProbability - baseProbability) * 100),
      reasoning: 'WhatsApp disponible - canal preferido para comunicación directa'
    });
  }
  
  // Email nurture for all leads
  const emailProbability = Math.min(1, baseProbability + CONFIG.ACTIONS.EMAIL_NURTURE.boost);
  recommendations.push({
    action: 'EMAIL_NURTURE',
    ...CONFIG.ACTIONS.EMAIL_NURTURE,
    currentProbability: Math.round(baseProbability * 100),
    newProbability: Math.round(emailProbability * 100),
    probabilityIncrease: Math.round((emailProbability - baseProbability) * 100),
    reasoning: 'Secuencia de emails mantiene el lead activo sin ser invasivo'
  });
  
  // Priority follow-up for medium-high probability leads
  if (baseProbability > 0.4 && baseProbability < 0.8) {
    const newProbability = Math.min(1, baseProbability + CONFIG.ACTIONS.PRIORITY_FOLLOW_UP.boost);
    recommendations.push({
      action: 'PRIORITY_FOLLOW_UP',
      ...CONFIG.ACTIONS.PRIORITY_FOLLOW_UP,
      currentProbability: Math.round(baseProbability * 100),
      newProbability: Math.round(newProbability * 100),
      probabilityIncrease: Math.round((newProbability - baseProbability) * 100),
      reasoning: 'Lead con potencial medio-alto se beneficia de seguimiento prioritario'
    });
  }
  
  // Sort recommendations by probability increase
  recommendations.sort((a, b) => b.probabilityIncrease - a.probabilityIncrease);
  
  return recommendations.slice(0, 3); // Top 3 recommendations
}

/**
 * Main prediction function
 */
async function predictLeadSuccess(leadData) {
  console.log('Processing prediction for lead:', leadData.email || leadData.phone || 'unknown');
  
  try {
    // Extract features
    const features = extractPredictionFeatures(leadData);
    console.log('Extracted features:', features);
    
    // Get prediction from ML model
    const prediction = await getPredictionFromModel(features);
    console.log('Model prediction:', prediction);
    
    // Generate recommended actions
    const recommendations = generateRecommendedActions(leadData, prediction, features);
    
    // Prepare response
    const result = {
      leadInfo: {
        email: leadData.email,
        phone: leadData.phone,
        name: leadData.name || leadData.companyName,
        value: features.leadValue,
        industry: features.leadIndustry,
        source: features.leadSource
      },
      prediction: {
        successProbability: Math.round(prediction.probability * 100), // Percentage
        predictedOutcome: prediction.predictedClass,
        confidence: Math.round(prediction.confidence * 100),
        riskLevel: prediction.probability > CONFIG.HIGH_PROBABILITY_THRESHOLD ? 'low' :
                  prediction.probability > CONFIG.MEDIUM_PROBABILITY_THRESHOLD ? 'medium' : 'high',
        leadScore: features.leadScore
      },
      recommendations,
      modelInfo: {
        version: prediction.modelVersion,
        predictionTime: prediction.predictionTime,
        featuresUsed: Object.keys(features).length
      },
      insights: {
        keyFactors: analyzeKeyFactors(features, prediction),
        improvementOpportunities: getImprovementOpportunities(features)
      }
    };
    
    return result;
    
  } catch (error) {
    console.error('Error in prediction process:', error);
    throw error;
  }
}

/**
 * Analyze key factors contributing to the prediction
 */
function analyzeKeyFactors(features, prediction) {
  const factors = [];
  
  if (features.leadValue > 25000) {
    factors.push('Alto valor del lead aumenta probabilidad de cierre');
  }
  
  if (features.leadUrgency === 'high') {
    factors.push('Urgencia alta indica necesidad inmediata');
  }
  
  if (features.budgetQualified && features.authorityConfirmed) {
    factors.push('Lead calificado en presupuesto y autoridad (BANT)');
  }
  
  if (features.hasPhone && features.hasEmail && features.hasWhatsApp) {
    factors.push('Múltiples canales de contacto disponibles');
  }
  
  if (features.leadScore > 70) {
    factors.push('Score de lead alto indica alta calidad');
  }
  
  return factors;
}

/**
 * Get improvement opportunities
 */
function getImprovementOpportunities(features) {
  const opportunities = [];
  
  if (!features.budgetQualified) {
    opportunities.push('Calificar presupuesto para mejorar predicción');
  }
  
  if (!features.authorityConfirmed) {
    opportunities.push('Identificar tomador de decisiones');
  }
  
  if (!features.needIdentified) {
    opportunities.push('Clarificar necesidad específica del negocio');
  }
  
  if (!features.timelineEstablished) {
    opportunities.push('Establecer timeline de compra');
  }
  
  if (!features.hasPhone) {
    opportunities.push('Obtener número telefónico para contacto directo');
  }
  
  return opportunities;
}

/**
 * HTTP Cloud Function - Get Lead Prediction
 */
exports.getLeadPrediction = functions.https.onRequest(async (req, res) => {
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
    
    const { leadData, organizationId } = req.body;
    
    if (!leadData) {
      return res.status(400).json({ error: 'leadData is required' });
    }
    
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }
    
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get prediction
    const prediction = await predictLeadSuccess(leadData);
    
    // Log prediction for analytics
    await db.collection('ml-predictions').add({
      organizationId,
      leadInfo: prediction.leadInfo,
      prediction: prediction.prediction,
      recommendationsCount: prediction.recommendations.length,
      modelVersion: prediction.modelInfo.version,
      requestedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json(prediction);
    
  } catch (error) {
    console.error('Function error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Batch prediction for multiple leads
 */
exports.batchPredictLeads = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const { leads, organizationId } = req.body;
    
    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({ error: 'leads array is required' });
    }
    
    if (leads.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 leads per batch request' });
    }
    
    // Process predictions in parallel
    const predictions = await Promise.all(
      leads.map(async (leadData, index) => {
        try {
          const prediction = await predictLeadSuccess(leadData);
          return { index, success: true, ...prediction };
        } catch (error) {
          return { 
            index, 
            success: false, 
            error: error.message,
            leadInfo: { email: leadData.email }
          };
        }
      })
    );
    
    // Log batch prediction
    await db.collection('ml-batch-predictions').add({
      organizationId,
      batchSize: leads.length,
      successCount: predictions.filter(p => p.success).length,
      requestedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({
      batchId: Date.now().toString(),
      predictions,
      summary: {
        total: leads.length,
        successful: predictions.filter(p => p.success).length,
        failed: predictions.filter(p => !p.success).length
      }
    });
    
  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(500).json({ error: error.message });
  }
});