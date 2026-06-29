import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  loginWithEmail, signOut, onAuthChange, getUserProfile,
  addJournalEntry, updateJournalEntry,
  type FirebaseUser,
  getDb,
} from '../firebase';
import {
  collection, doc, onSnapshot, query, where,
  updateDoc, increment,
} from 'firebase/firestore';
import type { Role, Student, JournalEntry, Company, User } from '../mockData';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
}

export interface AppData {
  students: Student[];
  journalEntries: JournalEntry[];
  companies: Company[];
  allUsers: User[];
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  data: AppData;
  loading: boolean;
  authLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  submitJournalEntry: (entry: Omit<JournalEntry, 'id' | 'submittedAt'>) => Promise<string>;
  approveEntry: (id: string, feedback: string) => Promise<void>;
  rejectEntry: (id: string, feedback: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const EMPTY_DATA: AppData = { students: [], journalEntries: [], companies: [], allUsers: [] };

function sortByDate(docs: Record<string, unknown>[]) {
  return docs.sort((a, b) => {
    const da = String(a.date ?? '');
    const db2 = String(b.date ?? '');
    return da < db2 ? 1 : da > db2 ? -1 : 0;
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hold active listener unsubscribers so we can tear them down on logout/role change
  const unsubsRef = useRef<(() => void)[]>([]);

  const teardown = () => {
    unsubsRef.current.forEach(u => u());
    unsubsRef.current = [];
  };

  const attachListeners = (user: AppUser) => {
    teardown();
    setLoading(true);
    setData(EMPTY_DATA);

    const db = getDb();
    const unsubs: (() => void)[] = [];

    // Track how many listeners still need their first snapshot
    let pending = 0;
    const registerPending = () => { pending++; };
    const resolvePending = () => { pending--; if (pending <= 0) setLoading(false); };

    // ── Companies (all roles) ─────────────────────────────────────────────────
    registerPending();
    { let fired = false; unsubs.push(
      onSnapshot(collection(db, 'companies'), snap => {
        setData(d => ({ ...d, companies: snap.docs.map(d => ({ id: d.id, ...d.data() } as Company)) }));
        if (!fired) { fired = true; resolvePending(); }
      }, err => setError(err.message))
    ); }

    // ── All users (admin only) ─────────────────────────────────────────────────
    if (user.role === 'admin') {
      registerPending();
      let fired = false;
      unsubs.push(
        onSnapshot(collection(db, 'users'), snap => {
          setData(d => ({ ...d, allUsers: snap.docs.map(d => ({ id: d.id, ...d.data() } as User)) }));
          if (!fired) { fired = true; resolvePending(); }
        }, err => setError(err.message))
      );
    }

    // ── Role-specific ─────────────────────────────────────────────────────────
    if (user.role === 'student') {
      registerPending();
      let stuFired = false;
      unsubs.push(
        onSnapshot(doc(db, 'students', user.uid), snap => {
          setData(d => ({ ...d, students: snap.exists() ? [{ id: snap.id, ...snap.data() } as Student] : [] }));
          if (!stuFired) { stuFired = true; resolvePending(); }
        }, err => setError(err.message))
      );

      registerPending();
      let jFired = false;
      unsubs.push(
        onSnapshot(query(collection(db, 'journalEntries'), where('studentId', '==', user.uid)), snap => {
          const docs = sortByDate(snap.docs.map(d => ({ id: d.id, ...d.data() }))) as JournalEntry[];
          setData(d => ({ ...d, journalEntries: docs }));
          if (!jFired) { jFired = true; resolvePending(); }
        }, err => setError(err.message))
      );

    } else if (user.role === 'supervisor') {
      registerPending();
      let supStudentsFired = false;
      unsubs.push(
        onSnapshot(query(collection(db, 'students'), where('supervisorId', '==', user.uid)), snap => {
          setData(d => ({ ...d, students: snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)) }));
          if (!supStudentsFired) { supStudentsFired = true; resolvePending(); }
        }, err => setError(err.message))
      );

      registerPending();
      let supJournalsFired = false;
      unsubs.push(
        onSnapshot(query(collection(db, 'journalEntries'), where('supervisorId', '==', user.uid)), snap => {
          const docs = sortByDate(snap.docs.map(d => ({ id: d.id, ...d.data() }))) as JournalEntry[];
          setData(d => ({ ...d, journalEntries: docs }));
          if (!supJournalsFired) { supJournalsFired = true; resolvePending(); }
        }, err => setError(err.message))
      );

    } else if (user.role === 'coordinator') {
      // Use plain-object refs shared by both listeners to avoid race conditions.
      // Whichever fires first stores its slice; both always recompute from the
      // latest values so no data is ever lost due to ordering.
      const cache = {
        studentIds: new Set<string>(),
        students:   [] as Student[],
        journals:   [] as JournalEntry[],
      };

      const recompute = () => {
        const filtered = cache.journals.filter(e => cache.studentIds.has(e.studentId));
        setData(d => ({ ...d, students: cache.students, journalEntries: filtered }));
      };

      registerPending();
      let studentsFired = false;
      unsubs.push(
        onSnapshot(query(collection(db, 'students'), where('coordinatorId', '==', user.uid)), snap => {
          cache.studentIds = new Set(snap.docs.map(d => d.id));
          cache.students   = snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
          recompute();
          if (!studentsFired) { studentsFired = true; resolvePending(); }
        }, err => setError(err.message))
      );

      // Watch ALL journal entries, filter client-side against coordinator's students.
      // This avoids needing a Firestore composite index and correctly handles
      // the case where the student list changes after journals have loaded.
      registerPending();
      let journalsFired = false;
      unsubs.push(
        onSnapshot(collection(db, 'journalEntries'), snap => {
          cache.journals = sortByDate(snap.docs.map(d => ({ id: d.id, ...d.data() }))) as JournalEntry[];
          recompute();
          if (!journalsFired) { journalsFired = true; resolvePending(); }
        }, err => setError(err.message))
      );

    } else {
      // admin — watch everything
      registerPending();
      let admStuFired = false;
      unsubs.push(
        onSnapshot(collection(db, 'students'), snap => {
          setData(d => ({ ...d, students: snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)) }));
          if (!admStuFired) { admStuFired = true; resolvePending(); }
        }, err => setError(err.message))
      );

      registerPending();
      let admJFired = false;
      unsubs.push(
        onSnapshot(collection(db, 'journalEntries'), snap => {
          const docs = sortByDate(snap.docs.map(d => ({ id: d.id, ...d.data() }))) as JournalEntry[];
          setData(d => ({ ...d, journalEntries: docs }));
          if (!admJFired) { admJFired = true; resolvePending(); }
        }, err => setError(err.message))
      );
    }

    unsubsRef.current = unsubs;
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid);
          if (profile) {
            const p = profile as Record<string, unknown>;
            const user: AppUser = {
              uid: fbUser.uid,
              email: fbUser.email ?? '',
              name: (p.name as string) ?? '',
              role: (p.role as Role) ?? 'student',
            };
            setAppUser(user);
            attachListeners(user);
          } else {
            setError('User profile not found. Please contact the administrator.');
            await signOut();
          }
        } catch (e) {
          setError((e as Error).message);
        }
      } else {
        teardown();
        setAppUser(null);
        setData(EMPTY_DATA);
      }
      setAuthLoading(false);
    });
    return () => { unsubscribe(); teardown(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    await loginWithEmail(email, password);
  };

  const logout = async () => {
    teardown();
    await signOut();
    setAppUser(null);
    setData(EMPTY_DATA);
  };

  // refreshData is a no-op now — listeners keep data live automatically
  const refreshData = async () => {};

  const submitJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'submittedAt'>) => {
    return await addJournalEntry(entry as Record<string, unknown>);
  };

  const approveEntry = async (id: string, feedback: string) => {
    await updateJournalEntry(id, { status: 'approved', supervisorFeedback: feedback });
    const entry = data.journalEntries.find(e => e.id === id);
    if (entry?.studentId && entry.hoursRendered > 0) {
      await updateDoc(doc(getDb(), 'students', entry.studentId), {
        completedHours: increment(entry.hoursRendered),
      });
    }
  };

  const rejectEntry = async (id: string, feedback: string) => {
    await updateJournalEntry(id, { status: 'rejected', supervisorFeedback: feedback });
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser, appUser, data, loading, authLoading, error,
      login, logout, refreshData, submitJournalEntry, approveEntry, rejectEntry,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
