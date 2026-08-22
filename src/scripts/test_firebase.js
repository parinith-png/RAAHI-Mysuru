import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, getDocs, deleteDoc, doc } from 'firebase/firestore';

// 1. Manually parse `.env` at root
const rootEnvPath = path.resolve('.env');
console.log('Reading env from:', rootEnvPath);
const envContent = fs.readFileSync(rootEnvPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      env[key] = val;
    }
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

console.log('Target Firebase Config URL:', firebaseConfig.authDomain);
console.log('Project ID:', firebaseConfig.projectId);

async function testPipeline() {
  console.log('Initializing Firebase app...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let onSnapshotTriggered = false;
  let testDocId = null;

  // 1. Hook up real-time listener (onSnapshot)
  console.log('Setting up real-time listener...');
  const unsubscribe = onSnapshot(collection(db, 'flags'), (snapshot) => {
    console.log(`[onSnapshot] Received collection update. Count: ${snapshot.size}`);
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        if (data.subtype === 'NodeJS verification test pothole') {
          console.log(`[onSnapshot] Detected test flag added! Document ID: ${change.doc.id}`);
          onSnapshotTriggered = true;
          testDocId = change.doc.id;
        }
      }
    });
  });

  // Wait 3 seconds for onSnapshot connection to settle
  await new Promise(r => setTimeout(r, 3000));

  // 2. Perform Create (Firestore write)
  const testFlag = {
    lat: 12.3051,
    lng: 76.6551,
    gridCellId: 'cell_12.31_76.66',
    type: 'hazard',
    subtype: 'NodeJS verification test pothole',
    createdBy: 'nodejs-test-agent',
    timestamp: new Date().toISOString(),
    active: true
  };

  console.log('Writing test document to Firestore flags collection...');
  const docRef = await addDoc(collection(db, 'flags'), testFlag);
  console.log('Document created successfully with ID:', docRef.id);

  // Wait 6 seconds to observe real-time listener update
  await new Promise(r => setTimeout(r, 6000));

  // Unsubscribe listener
  unsubscribe();
  console.log('Unsubscribed listener.');

  // Cleanup: Delete the test flag we wrote to avoid polluting the user's database!
  console.log('Cleaning up by deleting the created test document...');
  await deleteDoc(doc(db, 'flags', docRef.id));
  console.log('Cleaned up successfully.');

  console.log('\n--- VERIFICATION STATS ---');
  console.log('Firestore write success:', docRef.id ? 'PASS' : 'FAIL');
  console.log('Real-time listener callback triggered:', onSnapshotTriggered ? 'PASS' : 'FAIL');
  if (onSnapshotTriggered && testDocId === docRef.id) {
    console.log('Create matching check: PASS');
  } else {
    console.log('Create matching check: FAIL');
  }

  process.exit((docRef.id && onSnapshotTriggered) ? 0 : 1);
}

testPipeline().catch(err => {
  console.error('Test pipeline error:', err);
  process.exit(1);
});
