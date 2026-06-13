import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

let firebaseApp;

try {
  // If FIREBASE_SERVICE_ACCOUNT is a JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT.startsWith('{')) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } 
  // If FIREBASE_SERVICE_ACCOUNT is a path to a file
  else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT)
    });
  }
  else {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found in environment variables. Firebase Admin not initialized.');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
}

export default admin;
