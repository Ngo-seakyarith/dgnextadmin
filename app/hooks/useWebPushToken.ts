// hooks/useWebPushToken.ts
import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/app/lib/config/firebase'; // client-side firebase.ts
import { arrayUnion, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/app/lib/config/firebase';

export function useWebPushToken() {
  useEffect(() => {
    if (!messaging || !auth.currentUser) return;

    (async () => {
      try {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
        });
        if (!token) return;

        // Store under users/{uid}/pushTokens array (unique)
        const ref = doc(db, 'users', auth.currentUser!.uid);
        await setDoc(
          ref,
          { pushTokens: arrayUnion(token) },
          { merge: true }
        );
      } catch (e) {
        console.warn('Web push registration failed', e);
      }
    })();

    // Optional: foreground message handler
    onMessage(messaging, (payload) => {
      // Show your own UI or use browser Notification API
      new Notification(payload.notification?.title || 'New message', {
        body: payload.notification?.body,
        icon: '/icon-192x192.png',
      });
    });
  }, []);
}