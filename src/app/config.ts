// ─────────────────────────────────────────────────────────────────
// FIREBASE + CLOUDINARY CONFIGURATION
//
// On first launch the app shows a Setup screen where you paste your
// Firebase project config (from Firebase Console → Project Settings →
// Your apps → SDK setup and config → Config).
//
// Values are persisted in localStorage so setup is one-time per browser.
// ─────────────────────────────────────────────────────────────────

export const API_KEY = 'AIzaSyATC1KfTBsdZC8o7xsNp3sp-vbYRWtIyp0';
export const CLOUDINARY_API_KEY = '233188947458233';
export const CLOUDINARY_API_SECRET = 'WsFXI01eR-2xChaVUiNoF6oDga8';

export const CONFIG_STORAGE_KEY = 'ojt_firebase_config';
export const CLOUD_NAME_STORAGE_KEY = 'ojt_cloudinary_cloud_name';
export const DEFAULT_CLOUDINARY_CLOUD_NAME = 'dhk6bnzht';

export interface FirebaseConfigShape {
  apiKey: string;
  authDomain: string;
  databaseURL?: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const DEFAULT_FIREBASE_CONFIG: FirebaseConfigShape = {
  apiKey: "AIzaSyATC1KfTBsdZC8o7xsNp3sp-vbYRWtIyp0",
  authDomain: "ojtmonitoring-b8357.firebaseapp.com",
  databaseURL: "https://ojtmonitoring-b8357-default-rtdb.firebaseio.com",
  projectId: "ojtmonitoring-b8357",
  storageBucket: "ojtmonitoring-b8357.firebasestorage.app",
  messagingSenderId: "927706283083",
  appId: "1:927706283083:web:478532ae0d38090f7761ce",
  measurementId: "G-Z5VVZECP30",
};

export function getStoredFirebaseConfig(): FirebaseConfigShape {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_FIREBASE_CONFIG;
    return JSON.parse(raw) as FirebaseConfigShape;
  } catch {
    return DEFAULT_FIREBASE_CONFIG;
  }
}

export function saveFirebaseConfig(cfg: FirebaseConfigShape) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(cfg));
}

export function getCloudinaryCloudName(): string {
  return localStorage.getItem(CLOUD_NAME_STORAGE_KEY) ?? DEFAULT_CLOUDINARY_CLOUD_NAME;
}

export function saveCloudinaryCloudName(name: string) {
  localStorage.setItem(CLOUD_NAME_STORAGE_KEY, name);
}
