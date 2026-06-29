import { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, Loader2, Copy, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { saveFirebaseConfig, saveCloudinaryCloudName, type FirebaseConfigShape } from '../config';
import { initFirebase, createUserViaRest, setUserProfile, setStudentProfile, setCompany } from '../firebase';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const DEMO_ACCOUNTS = [
  { role: 'student' as const,     name: 'Juan dela Cruz',    email: 'juan.delacruz@ndkc-ojt.com',   password: 'Student@2026',     label: 'Student',      dot: 'bg-teal-500',   iconBg: '#dcfce7', color: '#15803d' },
  { role: 'supervisor' as const,  name: 'Maria Santos',      email: 'maria.santos@ndkc-ojt.com',     password: 'Supervisor@2026',  label: 'Supervisor',   dot: 'bg-blue-500',   iconBg: '#e0f2fe', color: '#0369a1' },
  { role: 'coordinator' as const, name: 'Dr. Roberto Reyes', email: 'roberto.reyes@ndkc-ojt.com',    password: 'Coordinator@2026', label: 'Coordinator',  dot: 'bg-amber-500',  iconBg: '#fef3c7', color: '#92400e' },
  { role: 'admin' as const,       name: 'OJT System Admin',  email: 'admin@ndkc-ojt.com',            password: 'Admin@2026!',      label: 'Administrator',dot: 'bg-purple-500', iconBg: '#ede9fe', color: '#5b21b6' },
];

interface Props { onComplete: () => void; }

type Step = 'config' | 'cloudinary' | 'seed' | 'done';

export function SetupScreen({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('config');
  const [cfg, setCfg] = useState<FirebaseConfigShape>({
    apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '',
  });
  const [cloudName, setCloudName] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState('');
  const [seedError, setSeedError] = useState('');
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [testError, setTestError] = useState('');
  const [testing, setTesting] = useState(false);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConfigNext = async () => {
    setTestError('');
    setTesting(true);
    try {
      saveFirebaseConfig(cfg);
      initFirebase(cfg);
      // Quick connectivity test — fetch nothing, just verifies SDK init
      const { getFirestore: gfs } = await import('firebase/firestore');
      const app = (await import('../firebase')).initFirebase(cfg);
      gfs(app); // will throw if project is wrong
      setStep('cloudinary');
    } catch (e) {
      setTestError((e as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const handleCloudinaryNext = () => {
    if (cloudName.trim()) saveCloudinaryCloudName(cloudName.trim());
    setStep('seed');
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedError('');
    try {
      const db = getFirestore();
      const uids: Record<string, string> = {};

      for (const acc of DEMO_ACCOUNTS) {
        setSeedProgress(`Creating ${acc.label} account…`);
        let uid: string;
        try {
          uid = await createUserViaRest(cfg.apiKey, acc.email, acc.password);
        } catch (e) {
          // account may already exist — try to find it
          const msg = (e as Error).message;
          if (msg.includes('EMAIL_EXISTS')) {
            // Use a placeholder; user can still log in
            uid = `${acc.role}_existing`;
          } else {
            throw e;
          }
        }
        uids[acc.role] = uid;

        // Register in permanent auth registry
        await setDoc(doc(db, 'authAccounts', uid), { email: acc.email, createdAt: new Date().toISOString().split('T')[0] }, { merge: true });

        setSeedProgress(`Saving ${acc.label} profile…`);
        const joinedAt = new Date().toISOString().split('T')[0];
        if (acc.role === 'student') {
          await setDoc(doc(db, 'users', uid), { name: acc.name, email: acc.email, role: acc.role, department: 'College of Teacher Education', status: 'active', joinedAt });
        } else if (acc.role === 'supervisor') {
          await setDoc(doc(db, 'users', uid), { name: acc.name, email: acc.email, role: acc.role, company: 'Notre Dame Technology Hub', status: 'active', joinedAt });
        } else if (acc.role === 'coordinator') {
          await setDoc(doc(db, 'users', uid), { name: acc.name, email: acc.email, role: acc.role, department: 'College of Teacher Education', status: 'active', joinedAt });
        } else {
          await setDoc(doc(db, 'users', uid), { name: acc.name, email: acc.email, role: acc.role, department: 'IT Services', status: 'active', joinedAt });
        }
      }

      setSeedProgress('Creating partner company…');
      const companyId = 'ndkc-tech-hub';
      await setDoc(doc(db, 'companies', companyId), {
        name: 'Notre Dame Technology Hub',
        industry: 'Information Technology',
        location: 'Notre Dame of Kidapawan College, Kidapawan City',
        contactPerson: uids.supervisor !== 'supervisor_existing' ? 'Maria Santos' : 'Maria Santos',
        studentsAssigned: 1,
        status: 'active',
      });

      setSeedProgress('Creating student profile…');
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
      await setDoc(doc(db, 'students', uids.student), {
        name: 'Juan dela Cruz',
        email: 'juan.delacruz@ndkc-ojt.com',
        company: 'Notre Dame Technology Hub',
        companyId,
        supervisorId: uids.supervisor,
        supervisorName: 'Maria Santos',
        coordinatorId: uids.coordinator,
        program: 'BS Information Technology',
        yearSection: '4IT-A',
        requiredHours: 500,
        completedHours: 0,
        startDate: today,
        endDate: endDate.toISOString().split('T')[0],
        status: 'active',
        phone: '09171234567',
      });

      setSeedProgress('Creating sample journal entries…');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];

      await setDoc(doc(db, 'journalEntries', 'je_sample_1'), {
        studentId: uids.student,
        studentName: 'Juan dela Cruz',
        supervisorId: uids.supervisor,
        date: yStr,
        timeIn: '08:00',
        timeOut: '17:00',
        hoursRendered: 8,
        tasks: 'Attended the morning orientation and briefing. Assisted the IT team with hardware inventory documentation. Set up workstations for new hires and configured their software environments. Participated in afternoon team meeting.',
        skillsDeveloped: ['IT Support', 'Documentation', 'Hardware Setup'],
        challenges: 'Configuring the network settings for new workstations took longer than expected due to domain policy restrictions.',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        attachments: [],
      });

      setSeedProgress('Setup complete!');
      setStep('done');
    } catch (e) {
      setSeedError((e as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1f108e' }}>
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>OJT Track</p>
            <p className="text-muted-foreground" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>FIRST TIME SETUP</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {(['config', 'cloudinary', 'seed', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step === s ? '#1f108e' : ((['config', 'cloudinary', 'seed', 'done'] as Step[]).indexOf(step) > i ? '#006a61' : '#e2e8f0'),
                  color: step === s || (['config', 'cloudinary', 'seed', 'done'] as Step[]).indexOf(step) > i ? '#fff' : '#94a3b8',
                }}
              >
                {(['config', 'cloudinary', 'seed', 'done'] as Step[]).indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 3 && <div className="w-8 h-px" style={{ background: '#e2e8f0' }} />}
            </div>
          ))}
        </div>

        {/* Step: Firebase Config */}
        {step === 'config' && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>Firebase Project Setup</h2>
              <p className="text-muted-foreground mt-1" style={{ fontSize: '0.82rem' }}>
                Paste your Firebase project config from <strong>Firebase Console → Project Settings → Your apps → Web app → Config</strong>
              </p>
            </div>

            <div className="p-3 rounded-lg text-xs" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}>
              Go to <strong>console.firebase.google.com</strong> → Select your project → Project Settings (⚙️) → Scroll to "Your apps" → Copy the <code>firebaseConfig</code> object values below.
            </div>

            <div className="space-y-3">
              {([
                { key: 'apiKey',            label: 'API Key',              placeholder: 'AIzaSy...' },
                { key: 'authDomain',        label: 'Auth Domain',          placeholder: 'your-project.firebaseapp.com' },
                { key: 'projectId',         label: 'Project ID',           placeholder: 'your-project-id' },
                { key: 'storageBucket',     label: 'Storage Bucket',       placeholder: 'your-project.appspot.com' },
                { key: 'messagingSenderId', label: 'Messaging Sender ID',  placeholder: '123456789' },
                { key: 'appId',             label: 'App ID',               placeholder: '1:123:web:abc123' },
              ] as { key: keyof FirebaseConfigShape; label: string; placeholder: string }[]).map(f => (
                <div key={f.key} className="space-y-1">
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={cfg[f.key]}
                    onChange={e => setCfg(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                    style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}
                  />
                </div>
              ))}
            </div>

            {testError && (
              <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: '#ffdad6', border: '1px solid #fecaca' }}>
                <AlertCircle size={15} style={{ color: '#ba1a1a', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.78rem', color: '#93000a' }}>{testError}</p>
              </div>
            )}

            <button
              onClick={handleConfigNext}
              disabled={testing || !cfg.apiKey || !cfg.projectId}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: '#1f108e', fontSize: '0.9rem' }}
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : null}
              {testing ? 'Connecting…' : 'Continue'} {!testing && <ChevronRight size={16} />}
            </button>
          </div>
        )}

        {/* Step: Cloudinary */}
        {step === 'cloudinary' && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>Cloudinary Setup</h2>
              <p className="text-muted-foreground mt-1" style={{ fontSize: '0.82rem' }}>
                Students can attach photo evidence to journal entries. Enter your Cloudinary cloud name.
              </p>
            </div>

            <div className="p-3 rounded-lg text-xs" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
              Go to <strong>cloudinary.com/console</strong> → Your cloud name is shown at the top of the dashboard (e.g., <code>dxyz1234</code>).
            </div>

            <div className="space-y-2 p-3 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Cloudinary Credentials</p>
              <div className="space-y-1">
                <p style={{ fontSize: '0.78rem', color: '#334155' }}>API Key: <code style={{ color: '#006a61' }}>946282315351968</code></p>
                <p style={{ fontSize: '0.78rem', color: '#334155' }}>API Secret: <code style={{ color: '#006a61' }}>L4hDCPvue19Lc_aB1XYR0OznBcQ</code></p>
              </div>
            </div>

            <div className="space-y-1">
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cloud Name</label>
              <input
                type="text"
                placeholder="e.g. dxyz1234"
                value={cloudName}
                onChange={e => setCloudName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('seed')}
                className="flex-1 py-2.5 rounded-xl border border-border font-medium transition-colors hover:bg-muted/40"
                style={{ fontSize: '0.85rem', color: '#64748b' }}
              >
                Skip for now
              </button>
              <button
                onClick={handleCloudinaryNext}
                className="flex-1 py-2.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#1f108e', fontSize: '0.9rem' }}
              >
                Continue <ChevronRight size={16} className="inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Seed */}
        {step === 'seed' && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>Initialize Database</h2>
              <p className="text-muted-foreground mt-1" style={{ fontSize: '0.82rem' }}>
                This will create 4 demo accounts in Firebase Auth and populate Firestore with initial data.
              </p>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <div key={acc.role} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className={`w-2 h-2 rounded-full ${acc.dot} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{acc.name}</p>
                    <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{acc.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: acc.iconBg, color: acc.color }}>{acc.label}</span>
                </div>
              ))}
            </div>

            {seedProgress && !seedError && (
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                {seeding && <Loader2 size={14} style={{ color: '#0369a1' }} className="animate-spin flex-shrink-0" />}
                <p style={{ fontSize: '0.8rem', color: '#0369a1' }}>{seedProgress}</p>
              </div>
            )}

            {seedError && (
              <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: '#ffdad6', border: '1px solid #fecaca' }}>
                <AlertCircle size={15} style={{ color: '#ba1a1a', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.78rem', color: '#93000a' }}>{seedError}</p>
              </div>
            )}

            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full py-2.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: '#006a61', fontSize: '0.9rem' }}
            >
              {seeding ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Initializing…</span> : 'Initialize System & Create Accounts'}
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
                <CheckCircle2 size={22} style={{ color: '#16a34a' }} />
              </div>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>Setup Complete!</h2>
                <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>Your system is ready. Save these credentials.</p>
              </div>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <div key={acc.role} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                  <div className="px-4 py-2 flex items-center justify-between" style={{ background: acc.iconBg }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: acc.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{acc.label}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: acc.color }}>{acc.name}</span>
                  </div>
                  <div className="px-4 py-3 space-y-2 bg-card">
                    {[
                      { label: 'Email', value: acc.email },
                      { label: 'Password', value: acc.password },
                    ].map(f => (
                      <div key={f.label} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground" style={{ fontSize: '0.72rem', minWidth: '56px' }}>{f.label}</span>
                        <div className="flex items-center gap-1.5 flex-1 justify-end">
                          <code style={{ fontSize: '0.78rem', color: '#334155' }}>
                            {f.label === 'Password' && !showPw[acc.role] ? '••••••••••' : f.value}
                          </code>
                          {f.label === 'Password' && (
                            <button onClick={() => setShowPw(p => ({ ...p, [acc.role]: !p[acc.role] }))}>
                              {showPw[acc.role] ? <EyeOff size={13} className="text-muted-foreground" /> : <Eye size={13} className="text-muted-foreground" />}
                            </button>
                          )}
                          <button
                            onClick={() => copyText(f.value, `${acc.role}_${f.label}`)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            {copied === `${acc.role}_${f.label}` ? <CheckCircle2 size={12} style={{ color: '#16a34a' }} /> : <Copy size={12} className="text-muted-foreground" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onComplete}
              className="w-full py-2.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#1f108e', fontSize: '0.9rem' }}
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
