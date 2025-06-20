/**
 * Mar-IA ML Cloud Functions
 * 
 * This file exports all Cloud Functions for the ML pipeline:
 * - exportLeadsForTraining: Export historical leads data for ML training
 * - getLeadPrediction: Get real-time lead predictions from trained model
 */

// Export ML training functions
const {
  exportLeadsForTraining,
  scheduledMLExport,
  getMLExportStatus
} = require('./exportLeadsForTraining');

// Export ML prediction functions
const {
  getLeadPrediction,
  batchPredictLeads
} = require('./getLeadPrediction');

// Training functions
exports.exportLeadsForTraining = exportLeadsForTraining;
exports.scheduledMLExport = scheduledMLExport;
exports.getMLExportStatus = getMLExportStatus;

// Prediction functions
exports.getLeadPrediction = getLeadPrediction;
exports.batchPredictLeads = batchPredictLeads;