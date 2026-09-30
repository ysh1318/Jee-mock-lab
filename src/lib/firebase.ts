import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBvREbjt2lsFcT9dfTFK5RosaPhXSuYo7c",
  authDomain: "jeemocklab.firebaseapp.com",
  projectId: "jeemocklab",
  storageBucket: "jeemocklab.firebasestorage.app",
  messagingSenderId: "917010364179",
  appId: "1:917010364179:web:2f486d6c64325f59f90ce6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Custom parameters to always prompt for account selection
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export async function signInWithGooglePopup() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Popup Auth Error:", error);
    throw error;
  }
}
