import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  indexedDBLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// indexedDBLocalPersistence outlives Safari ITP and PWA reloads better than
// the localStorage default. Fire-and-forget; the promise resolves before any
// sign-in call hits the wire in practice.
setPersistence(auth, indexedDBLocalPersistence).catch((e) => {
  console.warn("[firebase] setPersistence failed, falling back to default:", e?.message);
});

export const googleProvider = new GoogleAuthProvider();
// Always show the account chooser — without this, Google silently reuses the
// last signed-in account, which is confusing on shared devices.
googleProvider.setCustomParameters({ prompt: "select_account" });

// True when the page is running as an installed PWA (home-screen on iOS,
// standalone window on desktop). signInWithPopup is broken inside iOS
// standalone mode — callers should hide the Google button when this is true
// AND the platform is iOS.
export const isStandalonePWA = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator?.standalone === true);

export const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !window.MSStream;
