
"use client";
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';

const firebaseAuth = getAuth(app);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setInitialLoadDone(true);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading, initialLoadDone, authInstance: firebaseAuth };
}
