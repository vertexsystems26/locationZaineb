import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import type { Analytics } from "firebase/analytics";

// Next.js n'injecte les variables NEXT_PUBLIC_* que si elles sont lues explicitement.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  console.error(
    "[firebase] Configuration manquante : copiez .env.example en .env.local et renseignez les variables NEXT_PUBLIC_FIREBASE_*, puis relancez `npm run dev`.",
  );
}

/** Initialisation unique (évite les doublons avec le hot reload de Next.js). */
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createFirestore(): Firestore {
  try {
    // ignoreUndefinedProperties : un champ optionnel `undefined` ne fait pas échouer l'écriture.
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    // Déjà initialisé (hot reload) : on récupère l'instance existante.
    return getFirestore(app);
  }
}

export const db: Firestore = createFirestore();

let analyticsPromise: Promise<Analytics | null> | null = null;

/** Charge Google Analytics uniquement dans le navigateur et seulement s'il est supporté. */
export function initAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !firebaseConfig.measurementId) {
    return Promise.resolve(null);
  }
  if (!analyticsPromise) {
    analyticsPromise = import("firebase/analytics")
      .then(async ({ getAnalytics, isSupported }) => ((await isSupported()) ? getAnalytics(app) : null))
      .catch(() => null);
  }
  return analyticsPromise;
}
