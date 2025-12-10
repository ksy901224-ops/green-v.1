
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Helper to get env vars safely in Vite
const getEnv = (key: string) => {
  // Safely check if import.meta and import.meta.env exist
  if (import.meta && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  return undefined;
};

const apiKey = getEnv('VITE_FIREBASE_API_KEY');
// Check if configured: requires at least an API Key
export const isMockMode = !apiKey;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

let app;
let db: any;

if (!isMockMode) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase init failed, falling back to mock mode", e);
    db = null;
  }
} else {
  console.log("Running in Mock Mode (No Firebase Config Found)");
  db = null;
}

export { db };
