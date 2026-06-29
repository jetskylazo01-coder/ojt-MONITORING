import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { FirebaseConfigShape } from './config';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function initFirebase(cfg: FirebaseConfigShape): FirebaseApp {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    app = initializeApp(cfg);
  }
  db = getFirestore(app);
  return app;
}

export function getDb(): Firestore {
  if (!db) throw new Error('Firebase not initialized. Please complete setup.');
  return db;
}

export function getFirebaseAuth() {
  if (!app) throw new Error('Firebase not initialized. Please complete setup.');
  return getAuth(app);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return cred.user;
}

export async function signOut() {
  await firebaseSignOut(getFirebaseAuth());
}

export function onAuthChange(cb: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}

// Sign in via REST to get a UID without disturbing the current session
export async function getUidViaRest(
  apiKey: string,
  email: string,
  password: string
): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    }
  );
  const data = await res.json() as { localId?: string; error?: { message: string } };
  if (!res.ok) throw new Error(data.error?.message ?? 'Failed to sign in');
  return data.localId!;
}

// Create a user via Firebase REST API (doesn't disturb the current signed-in session)
export async function createUserViaRest(
  apiKey: string,
  email: string,
  password: string
): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json() as { localId?: string; error?: { message: string } };
  if (!res.ok) throw new Error(data.error?.message ?? 'Failed to create user');
  return data.localId!;
}

// ── Firestore ────────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string) {
  const d = await getDoc(doc(getDb(), 'users', uid));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

export async function setUserProfile(uid: string, data: Record<string, unknown>) {
  await setDoc(doc(getDb(), 'users', uid), data, { merge: true });
}

export async function getStudentById(uid: string) {
  const d = await getDoc(doc(getDb(), 'students', uid));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

export async function setStudentProfile(uid: string, data: Record<string, unknown>) {
  await setDoc(doc(getDb(), 'students', uid), data);
}

export async function getStudents(coordinatorId?: string, supervisorId?: string) {
  let q;
  if (coordinatorId) {
    q = query(collection(getDb(), 'students'), where('coordinatorId', '==', coordinatorId));
  } else if (supervisorId) {
    q = query(collection(getDb(), 'students'), where('supervisorId', '==', supervisorId));
  } else {
    q = collection(getDb(), 'students');
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getJournalEntries(studentId?: string, supervisorId?: string) {
  // Use simple where() without orderBy() to avoid needing composite Firestore indexes.
  // Sort by date descending in JavaScript after fetching.
  let q;
  if (studentId) {
    q = query(collection(getDb(), 'journalEntries'), where('studentId', '==', studentId));
  } else if (supervisorId) {
    q = query(collection(getDb(), 'journalEntries'), where('supervisorId', '==', supervisorId));
  } else {
    q = collection(getDb(), 'journalEntries');
  }
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown>));
  return docs.sort((a, b) => {
    const da = String(a.date ?? '');
    const db2 = String(b.date ?? '');
    return da < db2 ? 1 : da > db2 ? -1 : 0;
  });
}

export async function addJournalEntry(entry: Record<string, unknown>) {
  const ref = await addDoc(collection(getDb(), 'journalEntries'), {
    ...entry,
    submittedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateJournalEntry(id: string, data: Record<string, unknown>) {
  await updateDoc(doc(getDb(), 'journalEntries', id), {
    ...data,
    reviewedAt: serverTimestamp(),
  });
}

export async function getCompanies() {
  const snap = await getDocs(collection(getDb(), 'companies'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setCompany(id: string, data: Record<string, unknown>) {
  await setDoc(doc(getDb(), 'companies', id), data);
}

export async function getAllUsers() {
  const snap = await getDocs(collection(getDb(), 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export { type FirebaseUser };
