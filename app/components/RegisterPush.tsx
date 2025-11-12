// src/app/components/RegisterPush.tsx
'use client';

import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { messaging } from '@/app/lib/config/firebase';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';

export default function RegisterPush() {
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !messaging) return;

      try {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
        });
        if (!token) return;

        console.log('>>> NEW TOKEN:', token); // ← browser console

        await setDoc(
          doc(db, 'users', user.uid),
          { pushTokens: arrayUnion(token) },
          { merge: true }
        );
      } catch (e) {
        console.warn('Push registration failed', e);
      }
    });
    return () => unsub();
  }, []);

  return null;
}