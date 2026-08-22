// Firestore seed script — run with: npm run seed
// Seeds accidentHistory and flags collections with demo data
// Requires Firebase keys in .env

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { seedAccidents } from '../data/seedAccidents.js';
import { seedFlags, seedBlindSpots } from '../data/seedFlags.js';
import { getGridCellId } from '../utils/gridCell.js';

// Load env from .env file (Node.js doesn't support import.meta.env)
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../.env');

let env = {};
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length) env[key.trim()] = val.join('=').trim();
  });
} catch (e) {
  console.error('Could not read .env file:', e.message);
  process.exit(1);
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase keys not found in .env. Please add VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('🔥 Seeding Firestore with demo data...\n');

  // Seed accidents
  console.log(`📍 Seeding ${seedAccidents.length} accident history records...`);
  const accRef = collection(db, 'accidentHistory');
  for (const a of seedAccidents) {
    await addDoc(accRef, a);
  }
  console.log('   ✅ Accidents seeded.\n');

  // Seed community flags
  console.log(`⚠️  Seeding ${seedFlags.length} community flags...`);
  const flagRef = collection(db, 'flags');
  for (const f of seedFlags) {
    await addDoc(flagRef, {
      ...f,
      gridCellId: getGridCellId(f.lat, f.lng),
    });
  }
  console.log('   ✅ Flags seeded.\n');

  // Seed blind spots as flags
  console.log(`👁️  Seeding ${seedBlindSpots.length} blind spots...`);
  for (const bs of seedBlindSpots) {
    await addDoc(flagRef, {
      lat: bs.lat,
      lng: bs.lng,
      gridCellId: getGridCellId(bs.lat, bs.lng),
      type: 'blindspot',
      subtype: bs.subtype,
      createdBy: 'system',
      timestamp: new Date().toISOString(),
      active: true,
      radius: bs.radius,
      name: bs.name,
      source: 'synthetic',
    });
  }
  console.log('   ✅ Blind spots seeded.\n');

  console.log('🎉 Seeding complete! Your Firestore now has demo data.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
