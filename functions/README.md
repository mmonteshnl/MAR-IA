# Mar-IA ML Cloud Functions

This directory contains Cloud Functions for the Mar-IA predictive analytics pipeline using Google Cloud's Machine Learning services.

## Overview

The ML pipeline consists of 5 phases:

1. **Data Export** (`exportLeadsForTraining.js`) - Export historical leads to Cloud Storage
2. **Model Training** (Manual setup with Vertex AI AutoML)
3. **Prediction Service** (`getLeadPrediction.js`) - Real-time lead scoring
4. **Dashboard Integration** - Frontend analytics dashboard
5. **Pipeline Validation** - End-to-end testing

## Functions

### exportLeadsForTraining

**Purpose**: Exports historical leads data from Firestore to Google Cloud Storage in CSV format for ML model training.

**Triggers**:
- HTTP request (manual trigger)
- Cloud Scheduler (weekly automated export)

**Features**:
- Feature engineering for 15+ ML features
- Data validation and cleaning
- CSV export to Cloud Storage
- Export status tracking

**Endpoint**: `POST /exportLeadsForTraining`

**Request Body**:
```json
{
  "organizationId": "org_123456"
}
```

**Response**:
```json
{
  "success": true,
  "filename": "training-data-org_123456-2024-01-15T10-30-00.csv",
  "recordCount": 1250,
  "featuresCount": 16,
  "bucketPath": "gs://mar-ia-ml-training/training-datasets/...",
  "message": "Successfully exported 1250 leads for ML training"
}
```

### getLeadPrediction (Coming in Phase 3)

**Purpose**: Get real-time predictions for lead success probability.

### scheduledMLExport

**Purpose**: Automated weekly export of training data for all organizations.

**Schedule**: Every Monday at 2 AM (Mexico City timezone)

## Setup Instructions

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Google Cloud Storage

```bash
# Create ML training bucket
gsutil mb gs://your-ml-training-bucket

# Set bucket permissions
gsutil iam ch serviceAccount:your-functions-service-account@project.iam.gserviceaccount.com:objectAdmin gs://your-ml-training-bucket
```

### 4. Deploy Functions

```bash
# Deploy all functions
npm run deploy

# Deploy specific function
npm run deploy:export
```

## ML Features Extracted

The system extracts the following features for machine learning:

### Basic Lead Information
- `leadSource`: Source of the lead (META_ADS, GOOGLE_ADS, etc.)
- `leadIndustry`: Industry classification
- `leadValue`: Estimated deal value
- `leadUrgency`: Urgency level (high, medium, low)

### Company Characteristics
- `companySize`: Small, medium, large enterprise
- `contactMethod`: Preferred contact method

### Engagement Metrics
- `initialResponseTime`: Hours until first contact
- `followUpCount`: Number of follow-up interactions
- `daysInPipeline`: Days from lead creation to current status

### Contact Preferences
- `hasPhone`: Boolean for phone availability
- `hasEmail`: Boolean for email availability
- `hasWhatsApp`: Boolean for WhatsApp availability

### Qualification Factors (BANT)
- `budgetQualified`: Budget qualification status
- `authorityConfirmed`: Decision maker identification
- `needIdentified`: Business need confirmation
- `timelineEstablished`: Purchase timeline clarity

### Derived Features
- `leadScore`: Calculated lead score (0-100)
- `engagementLevel`: High, medium, low engagement

### Target Variable
- `finalOutcome`: Ganado (Won) or Perdido (Lost)

## Usage Examples

### Manual Export Trigger

```javascript
const response = await fetch('https://your-region-your-project.cloudfunctions.net/exportLeadsForTraining', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + await user.getIdToken()
  },
  body: JSON.stringify({
    organizationId: 'your-org-id'
  })
});

const result = await response.json();
console.log('Export completed:', result);
```

### Check Export Status

```javascript
const response = await fetch(`https://your-region-your-project.cloudfunctions.net/getMLExportStatus?organizationId=your-org-id`);
const status = await response.json();
console.log('Recent exports:', status.recentExports);
```

## Data Flow

1. **Data Collection**: Leads are stored in `leads-unified` Firestore collection
2. **Feature Engineering**: Raw lead data is processed into ML features
3. **Data Validation**: Leads must have final outcomes (Ganado/Perdido)
4. **CSV Export**: Features are exported to Cloud Storage
5. **Model Training**: Vertex AI AutoML trains on the CSV data
6. **Prediction**: Trained model provides real-time lead scoring

## Monitoring

- Export logs are stored in `ml-exports` Firestore collection
- Cloud Functions logs available in Google Cloud Console
- Export status can be checked via `getMLExportStatus` function

## Security

- Functions require Firebase Authentication
- CORS configured for specified domains
- Service account permissions restricted to necessary resources
- No sensitive data logged

## Cost Optimization

- Scheduled exports run weekly to minimize costs
- Data is filtered to only include leads with final outcomes
- CSV format chosen for efficient storage and processing
- Automatic cleanup of old export files (recommended setup)

## Next Steps

1. **Phase 2**: Setup Vertex AI AutoML model training
2. **Phase 3**: Implement `getLeadPrediction` function
3. **Phase 4**: Build predictive analytics dashboard
4. **Phase 5**: Complete pipeline validation

## Troubleshooting

### Common Issues

1. **Insufficient Training Data**: Ensure at least 100 leads with final outcomes
2. **Bucket Permissions**: Verify Cloud Functions service account has Storage permissions
3. **Authentication**: Check Firebase Auth token is valid
4. **CSV Format**: Verify all required features are present

### Debug Commands

```bash
# View function logs
firebase functions:log --only exportLeadsForTraining

# Test locally
firebase emulators:start --only functions

# Check bucket contents
gsutil ls gs://your-ml-training-bucket/training-datasets/
```