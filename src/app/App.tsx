import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { SetupScreen } from './components/SetupScreen';
import { Layout } from './components/Layout';
import { StudentModule } from './components/StudentModule';
import { SupervisorModule } from './components/SupervisorModule';
import { CoordinatorModule } from './components/CoordinatorModule';
import { AdminModule } from './components/AdminModule';
import { initFirebase } from './firebase';
import { getStoredFirebaseConfig } from './config';

function initFirebaseSync(): { ready: boolean; setup: boolean } {
  try {
    const cfg = getStoredFirebaseConfig();
    if (!cfg?.apiKey) return { ready: false, setup: true };
    initFirebase(cfg);
    return { ready: true, setup: false };
  } catch {
    return { ready: false, setup: true };
  }
}

function AppShell() {
  const { appUser, authLoading, loading, logout } = useAuth();
  const [page, setPage] = useState('dashboard');

  useEffect(() => { setPage('dashboard'); }, [appUser?.uid]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Authenticating…</p>
        </div>
      </div>
    );
  }

  if (!appUser) return <LoginPage />;

  const renderModule = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }
    switch (appUser.role) {
      case 'student':     return <StudentModule page={page} onNavigate={setPage} />;
      case 'supervisor':  return <SupervisorModule page={page} onNavigate={setPage} />;
      case 'coordinator': return <CoordinatorModule page={page} onNavigate={setPage} />;
      case 'admin':       return <AdminModule page={page} onNavigate={setPage} />;
    }
  };

  return (
    <Layout
      role={appUser.role}
      currentPage={page}
      onNavigate={setPage}
      onLogout={async () => { await logout(); setPage('dashboard'); }}
    >
      {renderModule()}
    </Layout>
  );
}

export default function App() {
  // Initialize Firebase synchronously on first render (lazy initializer runs once,
  // before paint) so the preview never sees a blank/spinner-only frame.
  const [{ ready, setup }, setFbState] = useState(initFirebaseSync);

  if (setup) {
    return (
      <SetupScreen
        onComplete={() => {
          try {
            const cfg = getStoredFirebaseConfig();
            if (cfg) initFirebase(cfg);
            setFbState({ ready: true, setup: false });
          } catch {
            setFbState({ ready: false, setup: true });
          }
        }}
      />
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground" style={{ fontSize: '0.85rem' }}>Initializing…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
