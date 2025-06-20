/**
 * Test Scripts for ML Cloud Functions
 * 
 * These scripts test the ML Cloud Functions locally or in Firebase emulators
 * Run with: node test-functions.js
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  // Local emulator URLs (change for production)
  EXPORT_FUNCTION_URL: 'http://localhost:5001/YOUR-PROJECT/us-central1/exportLeadsForTraining',
  PREDICTION_FUNCTION_URL: 'http://localhost:5001/YOUR-PROJECT/us-central1/getLeadPrediction',
  STATUS_FUNCTION_URL: 'http://localhost:5001/YOUR-PROJECT/us-central1/getMLExportStatus',
  
  // Test data
  TEST_ORG_ID: 'test-organization-123',
  TEST_TOKEN: 'fake-jwt-token-for-testing'
};

/**
 * Test data for various scenarios
 */
const TEST_LEADS = {
  HIGH_VALUE_LEAD: {
    email: 'ceo@highvalue.com',
    phone: '+1234567890',
    name: 'High Value Corp',
    source: 'META_ADS',
    industry: 'technology',
    estimatedValue: 75000,
    urgency: 'high',
    companySize: 'large',
    budgetQualified: true,
    authorityConfirmed: true,
    needIdentified: true,
    timelineEstablished: true,
    whatsapp: '+1234567890'
  },
  
  MEDIUM_VALUE_LEAD: {
    email: 'info@medium.com',
    phone: '+1987654321',
    name: 'Medium Business',
    source: 'GOOGLE_ADS',
    industry: 'retail',
    estimatedValue: 25000,
    urgency: 'medium',
    companySize: 'medium',
    budgetQualified: true,
    authorityConfirmed: false,
    needIdentified: true,
    timelineEstablished: false
  },
  
  LOW_VALUE_LEAD: {
    email: 'contact@small.com',
    name: 'Small Business',
    source: 'WEBSITE',
    industry: 'service',
    estimatedValue: 5000,
    urgency: 'low',
    companySize: 'small',
    budgetQualified: false,
    authorityConfirmed: false,
    needIdentified: false,
    timelineEstablished: false
  },
  
  INCOMPLETE_LEAD: {
    email: 'incomplete@test.com',
    source: 'REFERRAL',
    // Missing many fields to test validation
  }
};

/**
 * Utility function to make HTTP requests
 */
async function makeRequest(url, data, method = 'POST') {
  try {
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      },
      timeout: 30000
    });
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 'ERROR',
      error: error.response?.data || error.message
    };
  }
}

/**
 * Test 1: Export Function
 */
async function testExportFunction() {
  console.log('\n=== Testing Export Function ===');
  
  const testData = {
    organizationId: CONFIG.TEST_ORG_ID
  };
  
  console.log('Sending request to export function...');
  const result = await makeRequest(CONFIG.EXPORT_FUNCTION_URL, testData);
  
  if (result.success) {
    console.log('✅ Export function test PASSED');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    // Validate response structure
    const expectedFields = ['success', 'filename', 'recordCount', 'featuresCount'];
    const hasAllFields = expectedFields.every(field => result.data.hasOwnProperty(field));
    
    if (hasAllFields) {
      console.log('✅ Response structure is correct');
    } else {
      console.log('❌ Response missing required fields');
    }
  } else {
    console.log('❌ Export function test FAILED');
    console.log('Error:', result.error);
  }
  
  return result;
}

/**
 * Test 2: Prediction Function with various lead types
 */
async function testPredictionFunction() {
  console.log('\n=== Testing Prediction Function ===');
  
  for (const [leadType, leadData] of Object.entries(TEST_LEADS)) {
    console.log(`\nTesting ${leadType}:`);
    
    const testData = {
      organizationId: CONFIG.TEST_ORG_ID,
      leadData
    };
    
    const result = await makeRequest(CONFIG.PREDICTION_FUNCTION_URL, testData);
    
    if (result.success) {
      console.log(`✅ ${leadType} prediction test PASSED`);
      
      const prediction = result.data.prediction;
      console.log(`   Probability: ${prediction.successProbability}%`);
      console.log(`   Outcome: ${prediction.predictedOutcome}`);
      console.log(`   Risk Level: ${prediction.riskLevel}`);
      console.log(`   Recommendations: ${result.data.recommendations.length}`);
      
      // Validate prediction logic
      if (leadType === 'HIGH_VALUE_LEAD' && prediction.successProbability < 50) {
        console.log('⚠️  Warning: High value lead has low prediction - check logic');
      }
      
      if (leadType === 'LOW_VALUE_LEAD' && prediction.successProbability > 80) {
        console.log('⚠️  Warning: Low value lead has high prediction - check logic');
      }
      
    } else {
      console.log(`❌ ${leadType} prediction test FAILED`);
      console.log('Error:', result.error);
    }
  }
}

/**
 * Test 3: Batch Prediction
 */
async function testBatchPrediction() {
  console.log('\n=== Testing Batch Prediction ===');
  
  const testData = {
    organizationId: CONFIG.TEST_ORG_ID,
    leads: [
      TEST_LEADS.HIGH_VALUE_LEAD,
      TEST_LEADS.MEDIUM_VALUE_LEAD,
      TEST_LEADS.LOW_VALUE_LEAD
    ]
  };
  
  const batchUrl = CONFIG.PREDICTION_FUNCTION_URL.replace('getLeadPrediction', 'batchPredictLeads');
  const result = await makeRequest(batchUrl, testData);
  
  if (result.success) {
    console.log('✅ Batch prediction test PASSED');
    console.log(`Processed ${result.data.summary.total} leads`);
    console.log(`Successful: ${result.data.summary.successful}`);
    console.log(`Failed: ${result.data.summary.failed}`);
    
    // Check that all predictions have different probabilities
    const probabilities = result.data.predictions
      .filter(p => p.success)
      .map(p => p.prediction.successProbability);
    
    const uniqueProbabilities = new Set(probabilities);
    if (uniqueProbabilities.size === probabilities.length) {
      console.log('✅ All predictions have different probabilities (good!)');
    } else {
      console.log('⚠️  Some predictions have identical probabilities');
    }
    
  } else {
    console.log('❌ Batch prediction test FAILED');
    console.log('Error:', result.error);
  }
}

/**
 * Test 4: Export Status Function
 */
async function testStatusFunction() {
  console.log('\n=== Testing Export Status Function ===');
  
  const url = `${CONFIG.STATUS_FUNCTION_URL}?organizationId=${CONFIG.TEST_ORG_ID}`;
  const result = await makeRequest(url, null, 'GET');
  
  if (result.success) {
    console.log('✅ Status function test PASSED');
    console.log(`Total exports: ${result.data.totalExports}`);
    console.log(`Recent exports: ${result.data.recentExports.length}`);
    
    if (result.data.lastExport) {
      console.log(`Last export: ${result.data.lastExport.status} at ${result.data.lastExport.exportedAt}`);
    }
  } else {
    console.log('❌ Status function test FAILED');
    console.log('Error:', result.error);
  }
}

/**
 * Test 5: Error Handling
 */
async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  // Test missing organizationId
  console.log('Testing missing organizationId...');
  const result1 = await makeRequest(CONFIG.PREDICTION_FUNCTION_URL, {
    leadData: TEST_LEADS.HIGH_VALUE_LEAD
  });
  
  if (!result1.success && result1.status === 400) {
    console.log('✅ Missing organizationId error handling works');
  } else {
    console.log('❌ Missing organizationId error handling failed');
  }
  
  // Test missing leadData
  console.log('Testing missing leadData...');
  const result2 = await makeRequest(CONFIG.PREDICTION_FUNCTION_URL, {
    organizationId: CONFIG.TEST_ORG_ID
  });
  
  if (!result2.success && result2.status === 400) {
    console.log('✅ Missing leadData error handling works');
  } else {
    console.log('❌ Missing leadData error handling failed');
  }
  
  // Test invalid method
  console.log('Testing invalid HTTP method...');
  const result3 = await makeRequest(CONFIG.PREDICTION_FUNCTION_URL, {}, 'GET');
  
  if (!result3.success && result3.status === 405) {
    console.log('✅ Invalid method error handling works');
  } else {
    console.log('❌ Invalid method error handling failed');
  }
}

/**
 * Test 6: Performance Test
 */
async function testPerformance() {
  console.log('\n=== Testing Performance ===');
  
  const startTime = Date.now();
  const promises = [];
  
  // Send 5 concurrent requests
  for (let i = 0; i < 5; i++) {
    const testData = {
      organizationId: CONFIG.TEST_ORG_ID,
      leadData: { ...TEST_LEADS.HIGH_VALUE_LEAD, email: `test${i}@performance.com` }
    };
    
    promises.push(makeRequest(CONFIG.PREDICTION_FUNCTION_URL, testData));
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Processed ${successCount}/5 concurrent requests in ${totalTime}ms`);
  console.log(`Average response time: ${totalTime/5}ms per request`);
  
  if (totalTime < 10000) { // Less than 10 seconds for 5 requests
    console.log('✅ Performance test PASSED');
  } else {
    console.log('⚠️  Performance test: requests taking longer than expected');
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting ML Cloud Functions Test Suite');
  console.log('Make sure Firebase emulators are running!');
  console.log('Run: firebase emulators:start --only functions');
  
  try {
    // Test individual functions
    await testExportFunction();
    await testPredictionFunction();
    await testBatchPrediction();
    await testStatusFunction();
    
    // Test error scenarios
    await testErrorHandling();
    
    // Test performance
    await testPerformance();
    
    console.log('\n🎉 Test suite completed!');
    console.log('\nNext steps:');
    console.log('1. Review any failed tests above');
    console.log('2. Check Firebase emulator logs for errors');
    console.log('3. Deploy to production: npm run deploy');
    
  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error.message);
    process.exit(1);
  }
}

/**
 * Individual test runners for specific testing
 */
if (require.main === module) {
  const testName = process.argv[2];
  
  switch (testName) {
    case 'export':
      testExportFunction();
      break;
    case 'prediction':
      testPredictionFunction();
      break;
    case 'batch':
      testBatchPrediction();
      break;
    case 'status':
      testStatusFunction();
      break;
    case 'errors':
      testErrorHandling();
      break;
    case 'performance':
      testPerformance();
      break;
    default:
      runAllTests();
  }
}

module.exports = {
  testExportFunction,
  testPredictionFunction,
  testBatchPrediction,
  testStatusFunction,
  testErrorHandling,
  testPerformance,
  runAllTests
};