import { ReactNode, useState, useRef, useEffect } from 'react';
import {
  BookOpen, LayoutDashboard, BookText, ClipboardCheck, Users,
  BarChart3, Settings, LogOut, GraduationCap, Building2,
  ClipboardList, Shield, Menu, Bell, X, ChevronRight, CheckCircle2, Clock, AlertCircle, Star,
} from 'lucide-react';
import type { Role } from '../mockData';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

const navItems: Record<Role, NavItem[]> = {
  student: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-journal', label: "Log Today's Entry", icon: BookText },
    { id: 'my-journals', label: 'My Journals', icon: ClipboardList },
    { id: 'attendance', label: 'Attendance Log', icon: ClipboardCheck },
  ],
  supervisor: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'review', label: 'Review Journals', icon: ClipboardCheck },
    { id: 'students', label: 'My Students', icon: Users },
    { id: 'evaluations', label: 'Evaluations', icon: BarChart3 },
  ],
  coordinator: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'placements', label: 'Placements', icon: Building2 },
    { id: 'evaluations', label: 'Evaluations', icon: Star },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
};

const roleConfig: Record<Role, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  student:     { label: 'Student',       icon: GraduationCap, color: '#86f2e4' },
  supervisor:  { label: 'Supervisor',    icon: Building2,     color: '#a9a7ff' },
  coordinator: { label: 'Coordinator',   icon: ClipboardList, color: '#F59E0B' },
  admin:       { label: 'Administrator', icon: Shield,        color: '#ffdad6' },
};

function SidebarNav({
  role,
  currentPage,
  onNavigate,
  onLogout,
  onClose,
}: {
  role: Role;
  currentPage: string;
  onNavigate: (p: string) => void;
  onLogout: () => void;
  onClose?: () => void;
}) {
  const { appUser } = useAuth();
  const items = navItems[role];
  const cfg = roleConfig[role];
  const name = appUser?.name ?? role;
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full select-none" style={{ background: '#1f108e' }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <BookOpen size={15} className="text-white" />
          </div>
          <div>
            <p className="text-white" style={{ fontWeight: 700, fontSize: '0.92rem', letterSpacing: '-0.01em', fontFamily: "'Hanken Grotesk', sans-serif" }}>OJT Track</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Monitoring System</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)' }} className="lg:hidden hover:text-white transition-colors">
            <X size={17} />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.10)' }} />

      {/* Role pill */}
      <div className="px-4 mb-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 500 }}>{cfg.label} Portal</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose?.(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all relative group"
              style={{
                background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                color: active ? '#ffffff' : 'rgba(255,255,255,0.60)',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                  style={{ background: '#86f2e4', height: '60%', width: '3px' }}
                />
              )}
              <Icon size={16} style={{ color: active ? '#86f2e4' : 'inherit', flexShrink: 0 }} />
              <span className="flex-1 text-left" style={{ fontSize: '0.83rem', fontWeight: active ? 600 : 400 }}>{item.label}</span>
              {item.badge && (
                <span
                  className="text-white rounded-full flex items-center justify-center"
                  style={{ background: '#ba1a1a', fontSize: '0.6rem', fontWeight: 700, minWidth: '17px', height: '17px', padding: '0 4px' }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="flex items-center gap-3 mb-3 px-1">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: 'rgba(255,255,255,0.15)', fontSize: '0.72rem', fontWeight: 700 }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{name}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>{cfg.label}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all"
          style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(186,26,26,0.18)';
            e.currentTarget.style.color = '#ffdad6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function Layout({
  role,
  currentPage,
  onNavigate,
  onLogout,
  children,
}: {
  role: Role;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { data, appUser } = useAuth();
  const items     = navItems[role];
  const cfg       = roleConfig[role];
  const pageLabel = items.find((i) => i.id === currentPage)?.label ?? 'Dashboard';
  const today     = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const name      = appUser?.name ?? '';
  const initials  = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const recentEntries = data.journalEntries.slice(0, 8);
  const pendingCount  = data.journalEntries.filter(e => e.status === 'pending').length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[224px] flex-col flex-shrink-0">
        <SidebarNav role={role} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[224px] flex flex-col flex-shrink-0">
            <SidebarNav role={role} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">

        {/* ── Top header ─────────────────────────────────────────────────────── */}
        <header
          className="flex items-center gap-3 px-5 flex-shrink-0"
          style={{
            background: '#ffffff',
            borderBottom: '1px solid rgba(200,196,213,0.5)',
            height: '56px',
            zIndex: 10,
            position: 'relative',
          }}
        >
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-1.5 rounded-md transition-colors hover:bg-muted"
            style={{ color: '#777584' }}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            <div>
              <h2 style={{ fontWeight: 600, fontSize: '0.93rem', color: '#0d1c2e', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                {pageLabel}
              </h2>
              <p style={{ fontSize: '0.67rem', color: '#777584', marginTop: '1px' }}>{today}</p>
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5">

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(o => !o)}
                className="relative w-9 h-9 flex items-center justify-center rounded-md transition-colors hover:bg-muted"
                style={{ cursor: 'pointer' }}
              >
                <Bell size={17} style={{ color: notifOpen ? '#1f108e' : '#777584' }} />
                {pendingCount > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full text-white"
                    style={{ background: '#ba1a1a', fontSize: '0.5rem', fontWeight: 700, minWidth: '12px', height: '12px', padding: '0 2px' }}
                  >
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 bg-card overflow-hidden"
                  style={{ width: '320px', border: '1px solid rgba(200,196,213,0.5)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(31,16,142,0.10)', zIndex: 100 }}
                >
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #eff4ff' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0d1c2e' }}>Notifications</p>
                    {pendingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-white" style={{ background: '#ba1a1a', fontSize: '0.65rem', fontWeight: 700 }}>
                        {pendingCount} pending
                      </span>
                    )}
                  </div>
                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {recentEntries.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell size={20} style={{ color: '#c8c4d5', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '0.8rem', color: '#777584' }}>No recent activity</p>
                      </div>
                    ) : recentEntries.map((entry, i) => {
                      const icon = entry.status === 'approved'
                        ? <CheckCircle2 size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                        : entry.status === 'rejected'
                        ? <X size={13} style={{ color: '#ba1a1a', flexShrink: 0 }} />
                        : <Clock size={13} style={{ color: '#F59E0B', flexShrink: 0 }} />;
                      const statusLabel = entry.status === 'approved'
                        ? 'Journal approved'
                        : entry.status === 'rejected'
                        ? 'Journal rejected'
                        : 'Awaiting review';
                      return (
                        <div key={entry.id}>
                          {i > 0 && <div style={{ height: '1px', background: '#eff4ff' }} />}
                          <div
                            className="flex items-start gap-3 px-4 py-3 transition-colors"
                            style={{ background: entry.status === 'pending' ? 'rgba(245,158,11,0.04)' : 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = entry.status === 'pending' ? 'rgba(245,158,11,0.04)' : 'transparent'; }}
                          >
                            <div className="mt-0.5">{icon}</div>
                            <div className="flex-1 min-w-0">
                              <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#0d1c2e' }}>{entry.studentName}</p>
                              <p style={{ fontSize: '0.72rem', color: '#464553' }}>{statusLabel}</p>
                              <p style={{ fontSize: '0.67rem', color: '#777584', marginTop: '1px' }}>
                                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {' · '}{entry.hoursRendered}h
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {recentEntries.length > 0 && (
                    <div className="px-4 py-2.5 text-center" style={{ borderTop: '1px solid #eff4ff' }}>
                      <p style={{ fontSize: '0.72rem', color: '#777584' }}>Showing {recentEntries.length} most recent</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '24px', background: 'rgba(200,196,213,0.5)' }} />

            {/* User chip */}
            <div
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full transition-colors hover:bg-muted cursor-default"
              style={{ border: '1px solid rgba(200,196,213,0.4)' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ background: '#1f108e', fontSize: '0.6rem', fontWeight: 700 }}
              >
                {initials}
              </div>
              <div className="hidden sm:block">
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e', lineHeight: 1.2 }}>{name}</p>
                <p style={{ fontSize: '0.62rem', color: '#777584', lineHeight: 1 }}>{cfg.label}</p>
              </div>
            </div>

          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: '#f8f9ff' }}>{children}</main>
      </div>
    </div>
  );
}
