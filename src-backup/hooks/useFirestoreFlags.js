import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, firebaseAvailable } from '../config/firebase.js';
import { seedFlags } from '../data/seedFlags.js';
import { isFlagActive } from '../utils/flagVerification.js';
import { getGridCellId } from '../utils/gridCell.js';

export function useFirestoreFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingLocal, setUsingLocal] = useState(false);

  useEffect(() => {
    if (!firebaseAvailable || !db) {
      // Use local seed data as fallback
      const localFlags = seedFlags
        .filter(isFlagActive)
        .map((f, i) => ({
          id: `local_${i}`,
          ...f,
          gridCellId: getGridCellId(f.lat, f.lng),
        }));
      setFlags(localFlags);
      setLoading(false);
      setUsingLocal(true);
      return;
    }

    const q = query(
      collection(db, 'flags'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveFlags = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(isFlagActive)
          .map((f) => ({
            ...f,
            gridCellId: f.gridCellId || getGridCellId(f.lat, f.lng),
          }));

        // Merge with demo flags if Firestore is empty
        if (liveFlags.length === 0) {
          const demoFlags = seedFlags
            .filter(isFlagActive)
            .map((f, i) => ({
              id: `seed_${i}`,
              ...f,
              gridCellId: getGridCellId(f.lat, f.lng),
            }));
          setFlags(demoFlags);
        } else {
          setFlags(liveFlags);
        }
        setLoading(false);
        setUsingLocal(false);
      },
      (error) => {
        console.warn('Firestore flags error, using local data:', error.message);
        const localFlags = seedFlags
          .filter(isFlagActive)
          .map((f, i) => ({
            id: `local_${i}`,
            ...f,
            gridCellId: getGridCellId(f.lat, f.lng),
          }));
        setFlags(localFlags);
        setLoading(false);
        setUsingLocal(true);
      }
    );

    return () => unsubscribe();
  }, []);

  return { flags, loading, usingLocal };
}
