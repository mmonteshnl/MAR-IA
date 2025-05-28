import * as admin from 'firebase-admin';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
  if (!serviceAccountString) {
    console.warn('FIREBASE_SERVICE_ACCOUNT_JSON is not set. Firebase Admin SDK might not be initialized correctly for API routes needing admin privileges.');
    // Potentially throw error if admin features are critical and always needed
    // throw new Error('The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON or initialize Firebase Admin:", error);
      // Potentially throw error
      // throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or Firebase Admin failed to initialize.");
    }
  }
}


const firestoreDbAdmin = admin.apps.length ? admin.firestore() : null;
const authAdmin = admin.apps.length ? admin.auth() : null;

export { firestoreDbAdmin, authAdmin };
