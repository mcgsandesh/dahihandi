// public/firebase-messaging-sw.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-sw.js";

console.log("⚙️ [SW Initialization] Service Worker Script Execution Started.");

const params = new URLSearchParams(location.search);
const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId')
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  onBackgroundMessage(messaging, (payload) => {
    console.log("📩 [SW Background Event] Push Message Payload:", payload);
    const title = payload.notification?.title || "महाराष्ट्राचा गोविंदा";
    const options = {
      body: payload.notification?.body || "नवीन अपडेट प्राप्त झाली आहे!",
      icon: payload.notification?.icon || "/pwa-192x192.png",
      data: payload.data || {}
    };

    self.registration.showNotification(title, options);
  });
  console.log("✅ [SW Success] Firebase Messaging Initialized in SW!");
} else {
  console.error("❌ [SW Error] Firebase Config parameters missing in Service Worker URL!");
}