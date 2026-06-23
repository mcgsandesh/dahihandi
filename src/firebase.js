import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// .env.local मधून फायरबेस कॉन्फिगरेशन वाचणे
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
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// गूगल लॉगिन फंक्शन जे रोल देखील तपासेल
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // फायरबेस मधील 'users' कलेक्शनमधून या ईमेलचे डॉक्युमेंट शोधणे
    const userDocRef = doc(db, "users", user.email);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return { success: true, user, role: userData.role, teamName: userData.teamName };
    } else {
      // जर ईमेल डेटाबेसमध्ये नसेल, तर लॉगिन रिजेक्ट करणे
      await signOut(auth);
      return { success: false, error: "तुम्हाला या सिस्टीमचा ॲक्सेस नाही. कृपया सुपरॲडमिनशी संपर्क साधा." };
    }
  } catch (error) {
    console.error("लॉगिन एरर:", error);
    return { success: false, error: error.message };
  }
};