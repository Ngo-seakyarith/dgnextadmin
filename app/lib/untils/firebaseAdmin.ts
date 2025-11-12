// src/lib/utils/firebaseAdmin.ts
import admin, { ServiceAccount } from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error('Missing Firebase admin environment variables');
}

const serviceAccount: ServiceAccount = {
  projectId,
  clientEmail,
  privateKey: privateKey.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const firestore = admin.firestore();
export const messaging = admin.messaging();
