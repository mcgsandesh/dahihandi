import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc,
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// .env.local Config Keys
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 1. App, Auth & Offline Firestore Cache (तुझा मूळ जसाच्या तसा कोड)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const messaging = getMessaging(app);

/**
 * 🔑 2. FCM Token Generation & Sync Logic
 */
export const requestNotificationPermission = async (customContext = null) => {
  console.group("🚀 [FCM LOGIC] Token Generation & Firestore Sync");

  try {
    // 📌 Step 1: Permission Status Check
    const permission = await Notification.requestPermission();
    console.log("📌 [Step 1/5] Browser Notification Permission Status:", permission);

    if (permission !== 'granted') {
      console.warn("⚠️ [Step 1] Notification Permission is NOT granted.");
      console.groupEnd();
      return null;
    }

    // 📌 Step 2: VAPID Key Check
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    console.log("📌 [Step 2/5] VAPID Key Status:", vapidKey ? `Key Available (${vapidKey.substring(0, 10)}...)` : "❌ MISSING!");

    if (!vapidKey) {
      console.error("❌ [Step 2] VITE_FIREBASE_VAPID_KEY is missing in .env.local file!");
      console.groupEnd();
      return null;
    }

    // 📌 Step 3: Register Service Worker & Send Config via postMessage
    console.log("📌 [Step 3/5] Registering Service Worker...");
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const activeSw = await navigator.serviceWorker.ready;

    if (activeSw.active) {
      activeSw.active.postMessage({
        type: 'SET_FIREBASE_CONFIG',
        config: firebaseConfig
      });
      console.log("✉️ [Step 3.1/5] Sent Config to Service Worker via postMessage.");
    }

    // 📌 Step 4: Fetch FCM Token
    console.log("📌 [Step 4/5] Fetching Token via getToken()...");
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: activeSw
    });

    if (!token) {
      console.error("❌ [Step 4] getToken returned empty or null!");
      console.groupEnd();
      return null;
    }

    console.log("🎉 [Step 4 Success] FCM Token Successfully Obtained:", token);

    // 📌 Step 5: Save/Merge Token into Firestore 'fcm_tokens'
    const currentUser = auth.currentUser;
    const role = customContext?.role || (currentUser ? 'team_admin' : 'public');
    const hasFormAccess = customContext?.hasFormAccess ?? (currentUser?.allowInAppForm || false);

    console.log("📌 [Step 5/5] Saving to Firestore 'fcm_tokens' Collection with Payload:", {
      role: role,
      hasFormAccess: hasFormAccess,
      email: currentUser?.email || "Guest/Public User"
    });

    await setDoc(doc(db, "fcm_tokens", token), {
      token: token,
      role: role,
      hasFormAccess: hasFormAccess,
      email: currentUser?.email || null,
      uid: currentUser?.uid || null,
      updatedAt: serverTimestamp(),
      platform: navigator.platform || 'unknown',
      userAgent: navigator.userAgent || 'unknown'
    }, { merge: true });

    console.log("💾 ✅ [Step 5 Success] FCM Token successfully stored in Firestore 'fcm_tokens'!");
    console.groupEnd();
    return token;

  } catch (error) {
    console.error("💥 [CRITICAL FCM ERROR]:", error);
    console.groupEnd();
    return null;
  }
};

// 💬 3. Foreground Notification Listener (तुझा मूळ कोड)
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("📩 [Foreground Notification]:", payload);
      resolve(payload);
    });
  });

// 🎯 4. Google Auth Logic (तुझा मूळ कोड)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    console.error("लॉगिन करताना एरर आला:", error);
    return { success: false, error: error.message };
  }
};

export const logoutUser = () => signOut(auth);