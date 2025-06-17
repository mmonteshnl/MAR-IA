const admin = require('firebase-admin');

console.log('🔍 Firebase Admin module imported:', typeof admin, !!admin);

if (!admin) {
  throw new Error('Firebase Admin SDK failed to import properly');
}

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Firebase environment variables are not set. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    throw new Error('Firebase environment variables are not set.');
  } else {
    try {
      console.log('🔥 Attempting to initialize Firebase Admin SDK...');
      console.log('Admin object:', !!admin, !!admin.initializeApp, !!admin.credential);
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId,
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error);
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

export { admin, firestoreDbAdmin, authAdmin };
