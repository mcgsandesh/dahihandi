import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// .env.local मधून फायरबेस कॉन्फिगरेशन वाचणे (सुरक्षित)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ⚡ IndexedDB ऑफलाइन कॅश ऑन (0 Extra Reads Optimization)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager() // मल्टिपल टॅब्स उघडल्या तरी कॅश सुरक्षित राहते
  })
});

// 🎯 कडक बदल: साधा गुगल प्रोव्हायडर, कोणतीही एक्स्ट्रा परमिशन (Scopes) मागणार नाही!
const googleProvider = new GoogleAuthProvider();

// दरवेळी लॉगइन बटण दाबल्यावर युझरला त्याचा ईमेल आयडी सिलेक्ट करायचा सिंपल ऑप्शन देईल
googleProvider.setCustomParameters({ prompt: 'select_account' });

// गूगल लॉगिन फंक्शन (सिंपल आणि डायरेक्ट)
export const loginWithGoogle = async () => {
  try {
    // 🚀 सिंगल क्लिक गुगल पॉप-अप ओपन होईल
    const result = await signInWithPopup(auth, googleProvider);
    
    // फक्त गुगल ऑथेंटिकेशन यशस्वी झालेला युझर App.jsx कडे पाठवणे
    return { success: true, user: result.user };
    
  } catch (error) {
    console.error("लॉगिन एरer:", error);
    // युझरने पॉप-अप बंद केल्यास किंवा कॅन्सल केल्यास योग्य मेसेज देणे
    let friendlyError = error.message;
    if (error.code === 'auth/popup-closed-by-user') {
      friendlyError = "तुम्ही लॉगिन विंडो बंद केली आहे. कृपया पुन्हा प्रयत्न करा.";
    }
    return { success: false, error: friendlyError };
  }
};