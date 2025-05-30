import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKeyBase64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64;

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKeyBase64) {
    console.error('Firebase Admin environment variables are not set. Required: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY_BASE64');
    throw new Error('Firebase Admin environment variables are not set.');
  } else {
    try {
      console.log('🔥 Attempting to initialize Firebase Admin SDK...');
      
      // Decode the base64 private key
      const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
      
      // Create service account object with only required fields
      const serviceAccount: admin.ServiceAccount = {
        projectId: projectId,
        privateKey: privateKey,
        clientEmail: clientEmail,
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error("❌ Failed to initialize Firebase Admin:", error);
      console.error("Project ID:", projectId);
      console.error("Client Email:", clientEmail);
      console.error("Private Key Base64 length:", privateKeyBase64?.length);
      if (error instanceof Error) {
        throw new Error(`Firebase Admin failed to initialize: ${error.message}`);
      } else {
        throw new Error('Firebase Admin failed to initialize: Unknown error');
      }
    }
  }
}

const firestoreDbAdmin = admin.firestore();
const authAdmin = admin.auth();

const firebaseAdmin = { firestoreDbAdmin, authAdmin };
export default firebaseAdmin;

export { firestoreDbAdmin, authAdmin };
