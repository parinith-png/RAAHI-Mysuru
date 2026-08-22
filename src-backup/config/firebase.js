import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'projectId'];
const missing = requiredKeys.filter((k) => !firebaseConfig[k]);

let app = null;
let db = null;
let firebaseAvailable = false;

if (missing.length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseAvailable = true;
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
  }
} else {
  console.warn('Firebase not configured. Missing:', missing.join(', '));
}

export { app, db, firebaseAvailable };
