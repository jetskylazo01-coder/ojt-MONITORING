import { useState, useEffect } from 'react';
import {
  Users, Building2, BarChart3, Settings, Search,
  CheckCircle2, Shield, GraduationCap, ClipboardList,
  Bell, Database, Globe, Lock, Cloud, UserPlus, X, Loader2, Eye, EyeOff, Edit2, Trash2, AlertTriangle, Plus,
} from 'lucide-react';
import { createUserViaRest, getUidViaRest } from '../firebase';
import { getFirestore, doc, setDoc, updateDoc, collection, getDocs, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { API_KEY } from '../config';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { buildMonthlySubmissionsData, buildRoleDistributionData } from '../mockData';
import { saveCloudinaryCloudName, getCloudinaryCloudName, DEFAULT_CLOUDINARY_CLOUD_NAME } from '../config';

const ROLE_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  student:     { bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  supervisor:  { bg: '#e6eeff', color: '#1f108e', dot: '#3B82F6' },
  coordinator: { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  admin:       { bg: '#e6eeff', color: '#1f108e', dot: '#6366F1' },
};


function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_COLORS[role] ?? ROLE_COLORS.student;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: cfg.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      <span style={{ color: cfg.color, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>{role}</span>
    </span>
  );
}

function AdminDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { data } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = data.journalEntries.filter(e => e.date === today);
  const monthlyData = buildMonthlySubmissionsData(data.journalEntries);
  const roleData = buildRoleDistributionData(data.allUsers);

  const stats = [
    { label: 'Total Users',        value: data.allUsers.length.toString(),                                   sub: 'registered accounts', iconBg: '#E0F2FE', iconColor: '#0369A1', icon: Users },
    { label: 'Active Students',    value: data.students.filter(s => s.status === 'active').length.toString(), sub: 'currently training',  iconBg: '#D1FAE5', iconColor: '#059669', icon: GraduationCap },
    { label: 'Partner Companies',  value: data.companies.filter(c => c.status === 'active').length.toString(), sub: 'active institutions', iconBg: '#FEF3C7', iconColor: '#D97706', icon: Building2 },
    { label: 'Submissions Today',  value: todayEntries.length.toString(),                                    sub: 'journal entries',     iconBg: '#e6eeff', iconColor: '#6366F1', icon: BarChart3 },
  ];

  const recentActivity = data.journalEntries.slice(0, 5).map(e => ({
    user: e.studentName,
    action: 'submitted a journal entry',
    time: new Date(typeof e.submittedAt === 'string' ? e.submittedAt : Date.now()).toLocaleDateString(),
  }));

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-xl p-4" style={{ border: '1px solid #c8c4d5' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 500, color: '#464553', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                  <p style={{ fontSize: '1.7rem', fontWeight: 700, color: '#0d1c2e', lineHeight: 1.1, marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
                  <p style={{ fontSize: '0.67rem', color: '#777584', marginTop: '2px' }}>{s.sub}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.iconBg }}>
                  <Icon size={16} style={{ color: s.iconColor }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly chart */}
      <div className="bg-card rounded-xl p-5" style={{ border: '1px solid #c8c4d5' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e', marginBottom: '12px' }}>Monthly Journal Submissions (2026)</p>
        <ResponsiveContainer key="adm-monthly-rc" width="100%" height={200}>
          <BarChart key="adm-monthly-bc" data={monthlyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid key="adm-m-grid" strokeDasharray="3 3" vertical={false} stroke="#e6eeff" />
            <XAxis key="adm-m-x" dataKey="month" tick={{ fontSize: 11, fill: '#777584' }} axisLine={false} tickLine={false} />
            <YAxis key="adm-m-y" tick={{ fontSize: 11, fill: '#777584' }} axisLine={false} tickLine={false} />
            <Tooltip key="adm-m-tip" contentStyle={{ borderRadius: '6px', border: '1px solid #c8c4d5', boxShadow: '0 4px 16px #c8c4d5', fontSize: '12px' }} />
            <Bar key="adm-m-approved" dataKey="approved" fill="#006a61" radius={[3, 3, 0, 0]} maxBarSize={10} name="Approved" />
            <Bar key="adm-m-pending"  dataKey="pending"  fill="#F59E0B" radius={[3, 3, 0, 0]} maxBarSize={10} name="Pending" />
            <Bar key="adm-m-rejected" dataKey="rejected" fill="#ba1a1a" radius={[3, 3, 0, 0]} maxBarSize={10} name="Rejected" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-2 justify-center flex-wrap">
          {[{ color: '#006a61', label: 'Approved' }, { color: '#F59E0B', label: 'Pending' }, { color: '#ba1a1a', label: 'Rejected' }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              <span style={{ fontSize: '0.72rem', color: '#777584' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-xl p-5 lg:col-span-2" style={{ border: '1px solid #c8c4d5' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e', marginBottom: '8px' }}>User Distribution</p>
          <ResponsiveContainer key="adm-pie-rc" width="100%" height={160}>
            <PieChart key="adm-pie-pc">
              <Pie key="adm-pie-p" data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                {roleData.map((entry) => <Cell key={`adm-pie-cell-${entry.name}`} fill={entry.color} />)}
              </Pie>
              <Tooltip key="adm-pie-tip" contentStyle={{ borderRadius: '6px', border: '1px solid #c8c4d5', boxShadow: '0 4px 16px #c8c4d5', fontSize: '12px' }} />
              <Legend key="adm-pie-leg" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl overflow-hidden lg:col-span-3" style={{ border: '1px solid #c8c4d5' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Recent Activity</p>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center"><p style={{ fontSize: '0.82rem', color: '#777584' }}>No recent activity yet.</p></div>
          ) : recentActivity.map((act, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: '1px', background: '#eff4ff' }} />}
              <div className="px-5 py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#E0F2FE' }}>
                  <ClipboardList size={12} style={{ color: '#0369A1' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '0.8rem', color: '#464553', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600, color: '#0d1c2e' }}>{act.user}</span> {act.action}
                  </p>
                  <p style={{ fontSize: '0.68rem', color: '#777584', marginTop: '1px' }}>{act.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Department / program catalogue ───────────────────────────────────────────
const DEPARTMENTS: Record<string, { label: string; short: string; programs: string[] }> = {
  CECE: {
    short: 'CECE',
    label: 'College of Education, Culture & Environment',
    programs: ['BS Environmental Science', 'BS Biology', 'BS Social Studies Education', 'BS Science Education'],
  },
  CTELAN: {
    short: 'CTELAN',
    label: 'College of Teacher Education, Language & Natural Sciences',
    programs: ['BS Information Technology', 'BS Computer Science', 'Bachelor of Secondary Education', 'Bachelor of Elementary Education', 'BS Mathematics'],
  },
  CBA: {
    short: 'CBA',
    label: 'College of Business Administration',
    programs: ['BS Business Administration', 'BS Accountancy', 'BS Office Administration', 'BS Tourism Management', 'BS Hospitality Management'],
  },
};

function SelectField({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#464553' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #c8c4d5', background: '#eff4ff', fontSize: '0.875rem', color: '#0d1c2e', outline: 'none', cursor: 'pointer' }}
        onFocus={e => { e.currentTarget.style.borderColor = '#006a61'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#c8c4d5'; }}
      >
        {children}
      </select>
    </div>
  );
}

function TextField({ label, type = 'text', placeholder, value, onChange, suffix }: {
  label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void; suffix?: React.ReactNode;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #c8c4d5',
    background: '#eff4ff', fontSize: '0.875rem', color: '#0d1c2e', outline: 'none',
    paddingRight: suffix ? '40px' : '12px',
  };
  return (
    <div className="space-y-1.5">
      <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#464553' }}>{label}</label>
      <div className="relative">
        <input type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = '#006a61'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#c8c4d5'; }} />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
    </div>
  );
}

function CreateAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { data } = useAuth();
  const supervisors  = data.allUsers.filter(u => u.role === 'supervisor');
  const coordinators = data.allUsers.filter(u => u.role === 'coordinator');
  const companies    = data.companies;

  const defaultDept = 'CTELAN';
  const today = new Date().toISOString().split('T')[0];
  const sixMonths = new Date(); sixMonths.setMonth(sixMonths.getMonth() + 6);
  const sixMonthsStr = sixMonths.toISOString().split('T')[0];

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'student' as 'student' | 'supervisor' | 'coordinator' | 'admin',
    // common
    department: defaultDept,
    // student-specific
    program:        DEPARTMENTS[defaultDept].programs[0],
    yearSection:    '',
    phone:          '',
    companyId:      companies[0]?.id ?? '',
    supervisorId:   supervisors[0]?.id ?? '',
    coordinatorId:  coordinators[0]?.id ?? '',
    startDate:      today,
    endDate:        sixMonthsStr,
    requiredHours:  '500',
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving]  = useState(false);
  const [error, setError]    = useState('');

  const isStudent = form.role === 'student';

  const setDept = (dept: string) => {
    setForm(f => ({ ...f, department: dept, program: DEPARTMENTS[dept]?.programs[0] ?? '' }));
  };

  const setRole = (role: typeof form.role) => {
    setForm(f => ({ ...f, role }));
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Name, email and password are required.'); return;
    }
    if (isStudent && (!form.yearSection.trim() || !form.companyId || !form.supervisorId)) {
      setError('For students: Year/Section, Company and Supervisor are required.'); return;
    }
    if (form.role === 'coordinator') {
      const deptLabel = `${form.department} — ${DEPARTMENTS[form.department]?.label ?? form.department}`;
      const existing = data.allUsers.find(
        u => u.role === 'coordinator' && (u as Record<string, unknown>).department === deptLabel
      );
      if (existing) {
        setError(`${form.department} already has a coordinator (${(existing as Record<string,unknown>).name as string}). Only one coordinator per department is allowed.`);
        return;
      }
    }
    setSaving(true); setError('');
    try {
      const uid = await createUserViaRest(API_KEY, form.email.trim(), form.password);
      const db  = getFirestore();
      const deptLabel = `${form.department} — ${DEPARTMENTS[form.department]?.label ?? form.department}`;

      // users document (all roles)
      const userDoc: Record<string, unknown> = {
        name: form.name.trim(), email: form.email.trim(), role: form.role,
        status: 'active', joinedAt: today,
      };
      if (form.role === 'supervisor') {
        const company = companies.find(c => c.id === form.companyId);
        userDoc.company = company?.name ?? '';
      } else {
        userDoc.department = deptLabel;
      }
      await setDoc(doc(db, 'users', uid), userDoc);

      // students document (student role only)
      if (isStudent) {
        const company    = companies.find(c => c.id === form.companyId);
        const supervisor = supervisors.find(s => s.id === form.supervisorId);
        await setDoc(doc(db, 'students', uid), {
          name:           form.name.trim(),
          email:          form.email.trim(),
          company:        company?.name ?? '',
          companyId:      form.companyId,
          supervisorId:   form.supervisorId,
          supervisorName: supervisor?.name ?? '',
          coordinatorId:  form.coordinatorId,
          program:        form.program,
          yearSection:    form.yearSection.trim(),
          requiredHours:  parseInt(form.requiredHours) || 500,
          completedHours: 0,
          startDate:      form.startDate,
          endDate:        form.endDate,
          status:         'active',
          phone:          form.phone.trim(),
          department:     form.department,
        });
      }

      // Register in permanent auth registry (never wiped by reset)
      await setDoc(doc(db, 'authAccounts', uid), {
        email: form.email.trim(),
        createdAt: today,
      }, { merge: true });

      onCreated();
      onClose();
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg.includes('EMAIL_EXISTS') ? 'An account with this email already exists.' : msg);
    } finally { setSaving(false); }
  };

  const roleConfig = [
    { value: 'student',     label: 'Student',     dot: '#10B981' },
    { value: 'supervisor',  label: 'Supervisor',  dot: '#3B82F6' },
    { value: 'coordinator', label: 'Coordinator', dot: '#F59E0B' },
    { value: 'admin',       label: 'Admin',       dot: '#6366F1' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-card rounded-xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh', border: '1px solid #c8c4d5' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #e6eeff' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d1c2e' }}>Create New Account</p>
            <p style={{ fontSize: '0.73rem', color: '#777584', marginTop: '2px' }}>
              Firebase Auth + Firestore profile{isStudent ? ' + OJT placement' : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: '#777584' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e6eeff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <X size={17} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl" style={{ background: '#ffdad6', border: '1px solid #ffdad6' }}>
              <p style={{ fontSize: '0.8rem', color: '#93000a' }}>{error}</p>
            </div>
          )}

          {/* ── Basic info ── */}
          <TextField label="Full Name" placeholder="e.g. Maria Santos" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <TextField label="Email Address" type="email" placeholder="user@ndkc-ojt.com" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
          <TextField label="Password" type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password}
            onChange={v => setForm(f => ({ ...f, password: v }))}
            suffix={
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ color: '#777584', cursor: 'pointer' }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            } />

          {/* ── Role ── */}
          <div className="space-y-1.5">
            <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#464553' }}>Role</label>
            <div className="grid grid-cols-2 gap-2">
              {roleConfig.map(r => (
                <button type="button" key={r.value}
                  onClick={() => setRole(r.value as typeof form.role)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all"
                  style={{
                    fontSize: '0.82rem', fontWeight: form.role === r.value ? 600 : 400,
                    background: form.role === r.value ? '#F0FDF4' : '#fff',
                    borderColor: form.role === r.value ? '#006a61' : '#c8c4d5',
                    color: form.role === r.value ? '#065F46' : '#464553',
                    cursor: 'pointer',
                  }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.dot }} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Department ── */}
          <div className="space-y-1.5">
            <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#464553' }}>Department / College</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DEPARTMENTS).map(([key, d]) => (
                <button type="button" key={key} onClick={() => setDept(key)}
                  className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border transition-all text-center"
                  style={{
                    background: form.department === key ? '#e6eeff' : '#fff',
                    borderColor: form.department === key ? '#1f108e' : '#c8c4d5',
                    cursor: 'pointer',
                  }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: form.department === key ? '#1f108e' : '#464553' }}>
                    {d.short}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: '#777584', lineHeight: 1.3 }}>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Student-specific fields ── */}
          {isStudent && (
            <>
              <div style={{ height: '1px', background: '#e6eeff' }} />
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#777584', letterSpacing: '0.08em', textTransform: 'uppercase' }}>OJT Placement Details</p>

              <SelectField label="Program / Course" value={form.program} onChange={v => setForm(f => ({ ...f, program: v }))}>
                {DEPARTMENTS[form.department]?.programs.map(p => <option key={p} value={p}>{p}</option>)}
              </SelectField>

              <div className="grid grid-cols-2 gap-3">
                <TextField label="Year & Section" placeholder="e.g. 4IT-A" value={form.yearSection} onChange={v => setForm(f => ({ ...f, yearSection: v }))} />
                <TextField label="Phone Number" placeholder="e.g. 09171234567" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              </div>

              <SelectField label="Company / OJT Host" value={form.companyId} onChange={v => setForm(f => ({ ...f, companyId: v }))}>
                {companies.length === 0 && <option value="">— No companies yet —</option>}
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>

              <SelectField label="Assigned Supervisor" value={form.supervisorId} onChange={v => setForm(f => ({ ...f, supervisorId: v }))}>
                {supervisors.length === 0 && <option value="">— No supervisors yet —</option>}
                {supervisors.map(s => <option key={s.id} value={s.id}>{(s as Record<string,unknown>).name as string}</option>)}
              </SelectField>

              <SelectField label="Assigned Coordinator" value={form.coordinatorId} onChange={v => setForm(f => ({ ...f, coordinatorId: v }))}>
                {coordinators.length === 0 && <option value="">— No coordinators yet —</option>}
                {coordinators.map(c => <option key={c.id} value={c.id}>{(c as Record<string,unknown>).name as string}</option>)}
              </SelectField>

              <div className="grid grid-cols-3 gap-3">
                <TextField label="Start Date" type="date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} />
                <TextField label="End Date" type="date" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} />
                <TextField label="Required Hours" type="number" placeholder="500" value={form.requiredHours} onChange={v => setForm(f => ({ ...f, requiredHours: v }))} />
              </div>

              <div className="p-3 rounded-xl" style={{ background: '#e6eeff', border: '1px solid #c8c4d5' }}>
                <p style={{ fontSize: '0.75rem', color: '#1f108e', lineHeight: 1.6 }}>
                  <strong>Department:</strong> {form.department} — {DEPARTMENTS[form.department]?.label}<br />
                  <strong>Program:</strong> {form.program}<br />
                  After account creation, the student can log in and immediately start submitting journal entries.
                </p>
              </div>
            </>
          )}

          {/* ── Non-student: show company field for supervisor ── */}
          {form.role === 'supervisor' && companies.length > 0 && (
            <SelectField label="Company / Institution" value={form.companyId} onChange={v => setForm(f => ({ ...f, companyId: v }))}>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0 flex items-center gap-3 justify-end" style={{ borderTop: '1px solid #e6eeff' }}>
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl"
            style={{ fontSize: '0.83rem', color: '#464553', background: '#e6eeff', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={handleCreate} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#006a61', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}>
            {saving
              ? <><Loader2 size={13} className="animate-spin" /> Creating…</>
              : <><UserPlus size={13} /> Create Account</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditAccountModal({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const { data } = useAuth();
  const user    = data.allUsers.find(u => u.id === userId);
  const student = data.students.find(s => s.id === userId);
  const supervisors  = data.allUsers.filter(u => u.role === 'supervisor');
  const coordinators = data.allUsers.filter(u => u.role === 'coordinator');
  const companies    = data.companies;

  const [form, setForm] = useState({
    name:         (user as Record<string,unknown>)?.name as string ?? '',
    status:       (user?.status ?? 'active') as string,
    department:   (() => {
      const raw = ((user as Record<string,unknown>)?.department as string) ?? '';
      const key = Object.keys(DEPARTMENTS).find(k => raw.startsWith(k));
      return key ?? 'CTELAN';
    })(),
    // student fields
    program:       student?.program ?? '',
    yearSection:   student?.yearSection ?? '',
    phone:         student?.phone ?? '',
    companyId:     student?.companyId ?? (companies[0]?.id ?? ''),
    supervisorId:  student?.supervisorId ?? (supervisors[0]?.id ?? ''),
    coordinatorId: student?.coordinatorId ?? (coordinators[0]?.id ?? ''),
    requiredHours: String(student?.requiredHours ?? 500),
    startDate:    student?.startDate ?? '',
    endDate:      student?.endDate ?? '',
    // supervisor
    company:      ((user as Record<string,unknown>)?.company as string) ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [saved,  setSaved]  = useState(false);

  if (!user) return null;
  const isStudent    = user.role === 'student';
  const isSupervisor = user.role === 'supervisor';

  const setDept = (dept: string) => {
    const programs = DEPARTMENTS[dept]?.programs ?? [];
    setForm(f => ({
      ...f, department: dept,
      program: programs.includes(f.program) ? f.program : (programs[0] ?? ''),
    }));
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const db  = getFirestore();
      const deptLabel = `${form.department} — ${DEPARTMENTS[form.department]?.label ?? form.department}`;

      // Update users document
      const userUpdate: Record<string, unknown> = { name: form.name, status: form.status };
      if (isSupervisor) {
        const co = companies.find(c => c.id === form.companyId);
        userUpdate.company = co?.name ?? form.company;
      } else {
        userUpdate.department = deptLabel;
      }
      await updateDoc(doc(db, 'users', userId), userUpdate);

      // Update students document
      if (isStudent && student) {
        const co  = companies.find(c => c.id === form.companyId);
        const sup = supervisors.find(s => s.id === form.supervisorId);
        await updateDoc(doc(db, 'students', userId), {
          name:           form.name,
          company:        co?.name ?? '',
          companyId:      form.companyId,
          supervisorId:   form.supervisorId,
          supervisorName: (sup as Record<string,unknown>)?.name as string ?? '',
          coordinatorId:  form.coordinatorId,
          program:        form.program,
          yearSection:    form.yearSection,
          phone:          form.phone,
          requiredHours:  parseInt(form.requiredHours) || 500,
          startDate:      form.startDate,
          endDate:        form.endDate,
          status:         form.status,
          department:     form.department,
        });
      }

      setSaved(true);
      onSaved();
      setTimeout(onClose, 1200);
    } catch (e) {
      setError((e as Error).message);
    } finally { setSaving(false); }
  };

  const roleDot: Record<string, string> = { student: '#10B981', supervisor: '#3B82F6', coordinator: '#F59E0B', admin: '#6366F1' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-card rounded-xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh', border: '1px solid #c8c4d5' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #e6eeff' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d1c2e' }}>Edit Account</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: roleDot[user.role] ?? '#777584' }} />
              <p style={{ fontSize: '0.73rem', color: '#777584' }}>{user.email} · {user.role}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#777584' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e6eeff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {saved && (
            <div className="p-3 rounded-xl" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <p style={{ fontSize: '0.8rem', color: '#065F46', fontWeight: 500 }}>Changes saved successfully!</p>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl" style={{ background: '#ffdad6', border: '1px solid #ffdad6' }}>
              <p style={{ fontSize: '0.8rem', color: '#93000a' }}>{error}</p>
            </div>
          )}

          <TextField label="Full Name" placeholder="Full name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />

          {/* Status */}
          <div className="space-y-1.5">
            <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#464553' }}>Account Status</label>
            <div className="flex gap-2">
              {['active', 'inactive'].map(s => (
                <button type="button" key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all capitalize"
                  style={{
                    fontSize: '0.82rem', fontWeight: form.status === s ? 600 : 400, cursor: 'pointer',
                    background: form.status === s ? (s === 'active' ? '#ECFDF5' : '#ffdad6') : '#fff',
                    borderColor: form.status === s ? (s === 'active' ? '#006a61' : '#ba1a1a') : '#c8c4d5',
                    color: form.status === s ? (s === 'active' ? '#065F46' : '#93000a') : '#464553',
                  }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: s === 'active' ? '#10B981' : '#ba1a1a' }} />
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Department (non-supervisor) */}
          {!isSupervisor && (
            <div className="space-y-1.5">
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#464553' }}>Department / College</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(DEPARTMENTS).map(([key, d]) => (
                  <button type="button" key={key} onClick={() => setDept(key)}
                    className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition-all text-center"
                    style={{
                      background: form.department === key ? '#e6eeff' : '#fff',
                      borderColor: form.department === key ? '#1f108e' : '#c8c4d5', cursor: 'pointer',
                    }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: form.department === key ? '#1f108e' : '#464553' }}>{d.short}</span>
                    <span style={{ fontSize: '0.58rem', color: '#777584', lineHeight: 1.3 }}>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Supervisor: company */}
          {isSupervisor && companies.length > 0 && (
            <SelectField label="Company / Institution" value={form.companyId} onChange={v => setForm(f => ({ ...f, companyId: v }))}>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
          )}

          {/* Student OJT fields */}
          {isStudent && (
            <>
              <div style={{ height: '1px', background: '#e6eeff' }} />
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#777584', letterSpacing: '0.08em', textTransform: 'uppercase' }}>OJT Placement</p>

              <SelectField label="Program / Course" value={form.program} onChange={v => setForm(f => ({ ...f, program: v }))}>
                {DEPARTMENTS[form.department]?.programs.map(p => <option key={p} value={p}>{p}</option>)}
              </SelectField>

              <div className="grid grid-cols-2 gap-3">
                <TextField label="Year & Section" placeholder="e.g. 4IT-A" value={form.yearSection} onChange={v => setForm(f => ({ ...f, yearSection: v }))} />
                <TextField label="Phone Number" placeholder="09171234567" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              </div>

              <SelectField label="Company / OJT Host" value={form.companyId} onChange={v => setForm(f => ({ ...f, companyId: v }))}>
                {companies.length === 0 && <option value="">— No companies —</option>}
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>

              <SelectField label="Assigned Supervisor" value={form.supervisorId} onChange={v => setForm(f => ({ ...f, supervisorId: v }))}>
                {supervisors.length === 0 && <option value="">— No supervisors —</option>}
                {supervisors.map(s => <option key={s.id} value={s.id}>{(s as Record<string,unknown>).name as string}</option>)}
              </SelectField>

              <SelectField label="Assigned Coordinator" value={form.coordinatorId} onChange={v => setForm(f => ({ ...f, coordinatorId: v }))}>
                {coordinators.length === 0 && <option value="">— No coordinators —</option>}
                {coordinators.map(c => <option key={c.id} value={c.id}>{(c as Record<string,unknown>).name as string}</option>)}
              </SelectField>

              <div className="grid grid-cols-3 gap-3">
                <TextField label="Start Date" type="date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} />
                <TextField label="End Date" type="date" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} />
                <TextField label="Required Hours" type="number" value={form.requiredHours} onChange={v => setForm(f => ({ ...f, requiredHours: v }))} />
              </div>

              {/* Summary */}
              <div className="p-3 rounded-xl" style={{ background: '#e6eeff', border: '1px solid #c8c4d5' }}>
                <p style={{ fontSize: '0.75rem', color: '#1f108e', lineHeight: 1.6 }}>
                  <strong>Department:</strong> {form.department} — {DEPARTMENTS[form.department]?.label}<br />
                  <strong>Program:</strong> {form.program}<br />
                  <strong>Company:</strong> {companies.find(c => c.id === form.companyId)?.name ?? '—'}<br />
                  <strong>Supervisor:</strong> {(supervisors.find(s => s.id === form.supervisorId) as Record<string,unknown>)?.name as string ?? '—'}<br />
                  <strong>Coordinator:</strong> {(coordinators.find(c => c.id === form.coordinatorId) as Record<string,unknown>)?.name as string ?? '—'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0 flex gap-3 justify-end" style={{ borderTop: '1px solid #e6eeff' }}>
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl" style={{ fontSize: '0.83rem', color: '#464553', background: '#e6eeff', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || saved}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#006a61', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Register External Account — add a known Firebase Auth UID to the registry ──
function RegisterExternalAccount({ onRegistered }: { onRegistered: () => void }) {
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handle = async () => {
    if (!uid.trim() || !email.trim()) { setError('Both UID and email are required.'); return; }
    setSaving(true); setError('');
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'authAccounts', uid.trim()), {
        email: email.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      }, { merge: true });
      setDone(true); setUid(''); setEmail('');
      setTimeout(() => { setDone(false); setOpen(false); }, 1500);
      onRegistered();
    } catch (e) {
      setError((e as Error).message);
    } finally { setSaving(false); }
  };

  if (!open) {
    return (
      <div className="flex justify-end">
        <button type="button" onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all"
          style={{ fontSize: '0.75rem', color: '#464553', borderColor: '#c8c4d5', background: '#fff', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e6eeff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
          <UserPlus size={12} /> Register existing Firebase account
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 space-y-3" style={{ border: '1px solid #c8c4d5' }}>
      <div className="flex items-center justify-between">
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0d1c2e' }}>Register Existing Firebase Account</p>
        <button type="button" onClick={() => setOpen(false)} style={{ color: '#777584', cursor: 'pointer' }}><X size={15} /></button>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#777584' }}>
        If an account was created outside the app (e.g. Firebase Console), enter its UID and email so it appears here.
      </p>
      {error && <p style={{ fontSize: '0.75rem', color: '#93000a' }}>{error}</p>}
      {done && <p style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>Registered! Account will appear below.</p>}
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Firebase UID" placeholder="e.g. naJjTYfx5YUL…" value={uid} onChange={setUid} />
        <TextField label="Email Address" placeholder="user@example.com" value={email} onChange={setEmail} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg" style={{ fontSize: '0.78rem', color: '#464553', background: '#e6eeff', cursor: 'pointer' }}>Cancel</button>
        <button type="button" onClick={handle} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
          style={{ background: '#006a61', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
          {saving ? <><Loader2 size={11} className="animate-spin" /> Saving…</> : 'Register Account'}
        </button>
      </div>
    </div>
  );
}

// ── Assign Role Modal — sets up a Firestore profile for an existing Auth account ──
function AssignRoleModal({ uid, email, onClose, onSaved }: { uid: string; email: string; onClose: () => void; onSaved: () => void }) {
  const { data } = useAuth();
  const supervisors  = data.allUsers.filter(u => u.role === 'supervisor');
  const coordinators = data.allUsers.filter(u => u.role === 'coordinator');
  const companies    = data.companies;
  const defaultDept  = 'CTELAN';
  const today        = new Date().toISOString().split('T')[0];
  const sixMonths    = new Date(); sixMonths.setMonth(sixMonths.getMonth() + 6);

  const [form, setForm] = useState({
    name: '',
    role: 'student' as 'student' | 'supervisor' | 'coordinator' | 'admin',
    department: defaultDept,
    program:       DEPARTMENTS[defaultDept].programs[0],
    yearSection:   '',
    phone:         '',
    companyId:     companies[0]?.id ?? '',
    supervisorId:  supervisors[0]?.id ?? '',
    coordinatorId: coordinators[0]?.id ?? '',
    startDate:     today,
    endDate:       sixMonths.toISOString().split('T')[0],
    requiredHours: '500',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const isStudent = form.role === 'student';
  const setDept = (dept: string) => setForm(f => ({ ...f, department: dept, program: DEPARTMENTS[dept]?.programs[0] ?? '' }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Full name is required.'); return; }
    if (isStudent && (!form.yearSection.trim() || !form.companyId || !form.supervisorId)) {
      setError('For students: Year/Section, Company and Supervisor are required.'); return;
    }
    if (form.role === 'coordinator') {
      const deptLabel = `${form.department} — ${DEPARTMENTS[form.department]?.label ?? form.department}`;
      const existing = data.allUsers.find(u => u.role === 'coordinator' && (u as Record<string, unknown>).department === deptLabel);
      if (existing) { setError(`${form.department} already has a coordinator.`); return; }
    }
    setSaving(true); setError('');
    try {
      const db = getFirestore();
      const deptLabel = `${form.department} — ${DEPARTMENTS[form.department]?.label ?? form.department}`;

      const userDoc: Record<string, unknown> = { name: form.name.trim(), email, role: form.role, status: 'active', joinedAt: today };
      if (form.role === 'supervisor') {
        userDoc.company = companies.find(c => c.id === form.companyId)?.name ?? '';
      } else {
        userDoc.department = deptLabel;
      }
      await setDoc(doc(db, 'users', uid), userDoc);

      if (isStudent) {
        const company    = companies.find(c => c.id === form.companyId);
        const supervisor = supervisors.find(s => s.id === form.supervisorId);
        await setDoc(doc(db, 'students', uid), {
          name: form.name.trim(), email,
          company: company?.name ?? '', companyId: form.companyId,
          supervisorId: form.supervisorId, supervisorName: (supervisor as Record<string,unknown>)?.name as string ?? '',
          coordinatorId: form.coordinatorId,
          program: form.program, yearSection: form.yearSection.trim(),
          requiredHours: parseInt(form.requiredHours) || 500, completedHours: 0,
          startDate: form.startDate, endDate: form.endDate,
          status: 'active', phone: form.phone.trim(), department: form.department,
        });
      }

      onSaved(); onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally { setSaving(false); }
  };

  const roleConfig = [
    { value: 'student',     label: 'Student',     dot: '#10B981' },
    { value: 'supervisor',  label: 'Supervisor',  dot: '#3B82F6' },
    { value: 'coordinator', label: 'Coordinator', dot: '#F59E0B' },
    { value: 'admin',       label: 'Admin',       dot: '#6366F1' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-card rounded-xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh', border: '1px solid #c8c4d5' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #e6eeff' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d1c2e' }}>Assign Role to Account</p>
            <p style={{ fontSize: '0.73rem', color: '#777584', marginTop: '2px' }}>{email}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#777584' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e6eeff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl" style={{ background: '#ffdad6', border: '1px solid #ffdad6' }}>
              <p style={{ fontSize: '0.8rem', color: '#93000a' }}>{error}</p>
            </div>
          )}

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#464553' }}>Email Address</label>
            <div className="px-3 py-2.5 rounded-xl" style={{ background: '#e6eeff', border: '1px solid #c8c4d5', fontSize: '0.875rem', color: '#464553' }}>{email}</div>
          </div>

          <TextField label="Full Name" placeholder="e.g. Maria Santos" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />

          {/* Role */}
          <div className="space-y-1.5">
            <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#464553' }}>Role</label>
            <div className="grid grid-cols-2 gap-2">
              {roleConfig.map(r => (
                <button type="button" key={r.value} onClick={() => setForm(f => ({ ...f, role: r.value as typeof form.role }))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all"
                  style={{ fontSize: '0.82rem', fontWeight: form.role === r.value ? 600 : 400, cursor: 'pointer',
                    background: form.role === r.value ? '#F0FDF4' : '#fff',
                    borderColor: form.role === r.value ? '#006a61' : '#c8c4d5',
                    color: form.role === r.value ? '#065F46' : '#464553' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.dot }} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department */}
          {form.role !== 'supervisor' && (
            <div className="space-y-1.5">
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#464553' }}>Department / College</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(DEPARTMENTS).map(([key, d]) => (
                  <button type="button" key={key} onClick={() => setDept(key)}
                    className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border transition-all text-center"
                    style={{ background: form.department === key ? '#e6eeff' : '#fff', borderColor: form.department === key ? '#1f108e' : '#c8c4d5', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: form.department === key ? '#1f108e' : '#464553' }}>{d.short}</span>
                    <span style={{ fontSize: '0.6rem', color: '#777584', lineHeight: 1.3 }}>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Supervisor: company */}
          {form.role === 'supervisor' && (
            <SelectField label="Company / Institution" value={form.companyId} onChange={v => setForm(f => ({ ...f, companyId: v }))}>
              {companies.length === 0 && <option value="">— No companies yet —</option>}
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
          )}

          {/* Student fields */}
          {isStudent && (
            <>
              <div style={{ height: '1px', background: '#e6eeff' }} />
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#777584', letterSpacing: '0.08em', textTransform: 'uppercase' }}>OJT Placement Details</p>
              <SelectField label="Program / Course" value={form.program} onChange={v => setForm(f => ({ ...f, program: v }))}>
                {DEPARTMENTS[form.department]?.programs.map(p => <option key={p} value={p}>{p}</option>)}
              </SelectField>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Year & Section" placeholder="e.g. 4IT-A" value={form.yearSection} onChange={v => setForm(f => ({ ...f, yearSection: v }))} />
                <TextField label="Phone Number" placeholder="09171234567" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              </div>
              <SelectField label="Company / OJT Host" value={form.companyId} onChange={v => setForm(f => ({ ...f, companyId: v }))}>
                {companies.length === 0 && <option value="">— No companies yet —</option>}
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
              <SelectField label="Assigned Supervisor" value={form.supervisorId} onChange={v => setForm(f => ({ ...f, supervisorId: v }))}>
                {supervisors.length === 0 && <option value="">— No supervisors yet —</option>}
                {supervisors.map(s => <option key={s.id} value={s.id}>{(s as Record<string,unknown>).name as string}</option>)}
              </SelectField>
              <SelectField label="Assigned Coordinator" value={form.coordinatorId} onChange={v => setForm(f => ({ ...f, coordinatorId: v }))}>
                {coordinators.length === 0 && <option value="">— No coordinators yet —</option>}
                {coordinators.map(c => <option key={c.id} value={c.id}>{(c as Record<string,unknown>).name as string}</option>)}
              </SelectField>
              <div className="grid grid-cols-3 gap-3">
                <TextField label="Start Date" type="date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} />
                <TextField label="End Date" type="date" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} />
                <TextField label="Required Hours" type="number" placeholder="500" value={form.requiredHours} onChange={v => setForm(f => ({ ...f, requiredHours: v }))} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0 flex gap-3 justify-end" style={{ borderTop: '1px solid #e6eeff' }}>
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl" style={{ fontSize: '0.83rem', color: '#464553', background: '#e6eeff', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#006a61', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Assign Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  const { data } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [assignAccount, setAssignAccount] = useState<{ uid: string; email: string } | null>(null);
  const [authAccounts, setAuthAccounts] = useState<{ uid: string; email: string; createdAt: string }[]>([]);

  // Real-time listener on authAccounts registry
  useEffect(() => {
    const db = getFirestore();
    const unsub = onSnapshot(collection(db, 'authAccounts'), snap => {
      setAuthAccounts(snap.docs.map(d => ({ uid: d.id, ...(d.data() as { email: string; createdAt: string }) })));
    });
    return unsub;
  }, []);

  const provisionedUids = new Set(data.allUsers.map(u => u.id));
  const unprovisioned = authAccounts.filter(a =>
    !provisionedUids.has(a.uid) &&
    (search === '' || a.email.toLowerCase().includes(search.toLowerCase()))
  );

  const filtered = data.allUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6 space-y-5">
      {showCreate && (
        <CreateAccountModal onClose={() => setShowCreate(false)} onCreated={() => {}} />
      )}
      {editUserId && (
        <EditAccountModal userId={editUserId} onClose={() => setEditUserId(null)} onSaved={() => {}} />
      )}
      {assignAccount && (
        <AssignRoleModal
          uid={assignAccount.uid}
          email={assignAccount.email}
          onClose={() => setAssignAccount(null)}
          onSaved={() => setAssignAccount(null)}
        />
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1" style={{ minWidth: '200px' }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#777584' }} />
          <Input
            placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9" style={{ fontSize: '0.85rem', background: '#fff', border: '1px solid #c8c4d5', borderRadius: '6px' }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'student', 'supervisor', 'coordinator', 'admin'].map(r => (
            <button type="button" key={r} onClick={() => setRoleFilter(r)}
              className="px-3 py-1.5 rounded-full capitalize transition-all"
              style={{
                fontSize: '0.75rem', fontWeight: roleFilter === r ? 600 : 400,
                background: roleFilter === r ? '#0d1c2e' : '#fff',
                color: roleFilter === r ? '#fff' : '#464553',
                border: '1px solid', borderColor: roleFilter === r ? '#0d1c2e' : '#c8c4d5',
              }}>
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: '#006a61', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          <UserPlus size={15} /> New Account
        </button>
      </div>

      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8f9ff', borderBottom: '1px solid #e6eeff' }}>
                {['User', 'Email', 'Role', 'Department / Company', 'Joined', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '0.63rem', fontWeight: 700, color: '#777584', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr
                  key={user.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #eff4ff' : 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: ROLE_COLORS[user.role]?.bg ?? '#e6eeff', color: ROLE_COLORS[user.role]?.color ?? '#464553', fontSize: '0.7rem', fontWeight: 700 }}
                      >
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0d1c2e', whiteSpace: 'nowrap' }}>{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5" style={{ fontSize: '0.78rem', color: '#464553' }}>{user.email}</td>
                  <td className="px-4 py-3.5"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3.5" style={{ fontSize: '0.78rem', color: '#464553', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.department ?? user.company ?? '—'}
                  </td>
                  <td className="px-4 py-3.5" style={{ fontSize: '0.78rem', color: '#464553', whiteSpace: 'nowrap' }}>
                    {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                      style={{
                        background: user.status === 'active' ? '#D1FAE5' : '#e6eeff',
                        color: user.status === 'active' ? '#065F46' : '#464553',
                        fontSize: '0.7rem', fontWeight: 600,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: user.status === 'active' ? '#10B981' : '#777584' }} />
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button type="button" onClick={() => setEditUserId(user.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all"
                      style={{ fontSize: '0.72rem', color: '#006a61', borderColor: '#c8c4d5', background: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#006a61'; e.currentTarget.style.background = '#F0FDF4'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#c8c4d5'; e.currentTarget.style.background = '#fff'; }}>
                      <Edit2 size={11} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ fontSize: '0.85rem', color: '#777584' }}>No users match your search</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Register External Account ─────────────────────────────── */}
      <RegisterExternalAccount onRegistered={() => {}} />

      {/* ── Unprovisioned Auth Accounts ────────────────────────────── */}
      {unprovisioned.length > 0 && (
        <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #FDE68A' }}>
          <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400E' }}>
              {unprovisioned.length} Firebase account{unprovisioned.length > 1 ? 's' : ''} without a profile — assign a role to activate
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8f9ff', borderBottom: '1px solid #e6eeff' }}>
                  {['Email', 'Firebase UID', 'Registered', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '0.63rem', fontWeight: 700, color: '#777584', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unprovisioned.map((acc, i) => (
                  <tr key={acc.uid}
                    style={{ borderBottom: i < unprovisioned.length - 1 ? '1px solid #eff4ff' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-3.5" style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0d1c2e' }}>{acc.email}</td>
                    <td className="px-4 py-3.5" style={{ fontSize: '0.72rem', color: '#777584', fontFamily: 'monospace' }}>{acc.uid}</td>
                    <td className="px-4 py-3.5" style={{ fontSize: '0.78rem', color: '#464553', whiteSpace: 'nowrap' }}>{acc.createdAt}</td>
                    <td className="px-4 py-3.5">
                      <button type="button"
                        onClick={() => setAssignAccount({ uid: acc.uid, email: acc.email })}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all"
                        style={{ fontSize: '0.72rem', color: '#D97706', borderColor: '#FDE68A', background: '#FFFBEB', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#D97706'; e.currentTarget.style.background = '#FEF3C7'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#FDE68A'; e.currentTarget.style.background = '#FFFBEB'; }}>
                        <UserPlus size={11} /> Assign Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AddCompanyModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', industry: '', location: '', contactPerson: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Company name is required.'); return; }
    if (!form.industry.trim()) { setError('Industry is required.'); return; }
    if (!form.location.trim()) { setError('Location is required.'); return; }
    setSaving(true); setError('');
    try {
      const db = getFirestore();
      const id = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      await setDoc(doc(db, 'companies', id), {
        name: form.name.trim(),
        industry: form.industry.trim(),
        location: form.location.trim(),
        contactPerson: form.contactPerson.trim(),
        studentsAssigned: 0,
        status: 'active',
      });
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError((e as Error).message);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-card rounded-xl shadow-2xl flex flex-col" style={{ border: '1px solid #c8c4d5' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #e6eeff' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d1c2e' }}>Add New Company</p>
            <p style={{ fontSize: '0.73rem', color: '#777584', marginTop: '2px' }}>Register a new partner institution in Firestore</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#777584' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e6eeff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <X size={17} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {done && (
            <div className="p-3 rounded-xl" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <p style={{ fontSize: '0.8rem', color: '#065F46', fontWeight: 500 }}>Company added successfully!</p>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl" style={{ background: '#ffdad6', border: '1px solid #ffdad6' }}>
              <p style={{ fontSize: '0.8rem', color: '#93000a' }}>{error}</p>
            </div>
          )}
          <TextField label="Company Name" placeholder="e.g. Notre Dame Technology Hub" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <TextField label="Industry" placeholder="e.g. Information Technology" value={form.industry} onChange={v => setForm(f => ({ ...f, industry: v }))} />
          <TextField label="Location" placeholder="e.g. Kidapawan City, North Cotabato" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
          <TextField label="Contact Person" placeholder="e.g. Maria Santos" value={form.contactPerson} onChange={v => setForm(f => ({ ...f, contactPerson: v }))} />
        </div>
        <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid #e6eeff' }}>
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl" style={{ fontSize: '0.83rem', color: '#464553', background: '#e6eeff', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || done}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#006a61', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Plus size={13} /> Add Company</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Companies() {
  const { data } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div className="p-6 space-y-5">
      {showAdd && <AddCompanyModal onClose={() => setShowAdd(false)} />}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Companies', value: data.companies.length.toString(), color: '#0d1c2e' },
          { label: 'Active', value: data.companies.filter(c => c.status === 'active').length.toString(), color: '#059669' },
          { label: 'Students Placed', value: data.companies.reduce((a, c) => a + c.studentsAssigned, 0).toString(), color: '#006a61' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 text-center" style={{ border: '1px solid #c8c4d5' }}>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
            <p style={{ fontSize: '0.72rem', color: '#464553', marginTop: '2px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Partner Companies</p>
          <button type="button" onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ background: '#006a61', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={13} /> Add Company
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8f9ff', borderBottom: '1px solid #e6eeff' }}>
                {['Company', 'Industry', 'Location', 'Contact', 'Students', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left" style={{ fontSize: '0.63rem', fontWeight: 700, color: '#777584', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.companies.map((c, i) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: i < data.companies.length - 1 ? '1px solid #eff4ff' : 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#e6eeff' }}>
                        <Building2 size={13} style={{ color: '#1f108e' }} />
                      </div>
                      <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0d1c2e' }}>{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4" style={{ fontSize: '0.78rem', color: '#464553' }}>{c.industry}</td>
                  <td className="px-5 py-4" style={{ fontSize: '0.78rem', color: '#464553' }}>{c.location}</td>
                  <td className="px-5 py-4" style={{ fontSize: '0.78rem', color: '#464553' }}>{c.contactPerson}</td>
                  <td className="px-5 py-4 text-center" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>{c.studentsAssigned}</td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{ background: c.status === 'active' ? '#D1FAE5' : '#e6eeff', color: c.status === 'active' ? '#065F46' : '#464553', fontSize: '0.7rem', fontWeight: 600 }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.status === 'active' ? '#10B981' : '#777584' }} />
                      {c.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {data.companies.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center" style={{ fontSize: '0.82rem', color: '#777584' }}>No companies yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const RESET_DEMO_ACCOUNTS = [
  { role: 'student' as const,     name: 'Juan dela Cruz',    email: 'juan.delacruz@ndkc-ojt.com',  password: 'Student@2026' },
  { role: 'supervisor' as const,  name: 'Maria Santos',      email: 'maria.santos@ndkc-ojt.com',   password: 'Supervisor@2026' },
  { role: 'coordinator' as const, name: 'Dr. Roberto Reyes', email: 'roberto.reyes@ndkc-ojt.com',  password: 'Coordinator@2026' },
  { role: 'admin' as const,       name: 'OJT System Admin',  email: 'admin@ndkc-ojt.com',          password: 'Admin@2026!' },
];

async function wipeCollection(db: ReturnType<typeof getFirestore>, name: string) {
  const snap = await getDocs(collection(db, name));
  const batches: Promise<void>[] = [];
  // Firestore batch max 500 ops
  let batch = writeBatch(db);
  let count = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    count++;
    if (count === 499) {
      batches.push(batch.commit());
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) batches.push(batch.commit());
  await Promise.all(batches);
  return snap.size;
}

function ResetDatabaseSection({ onReset }: { onReset: () => void }) {
  const { refreshData } = useAuth();
  const [confirm, setConfirm] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState('');
  const [progress, setProgress] = useState('');

  const handleReset = async () => {
    if (confirm !== 'RESET') return;
    setResetting(true); setResetError(''); setResetDone(false);
    try {
      const db = getFirestore();

      // Before wiping users, preserve their emails in authAccounts registry
      setProgress('Preserving auth account registry…');
      const usersSnap = await getDocs(collection(db, 'users'));
      const today = new Date().toISOString().split('T')[0];
      await Promise.all(usersSnap.docs.map(d => {
        const email = (d.data() as Record<string, unknown>).email as string;
        if (email) return setDoc(doc(db, 'authAccounts', d.id), { email, createdAt: today }, { merge: true });
      }));

      setProgress('Clearing journal entries…');
      await wipeCollection(db, 'journalEntries');

      setProgress('Clearing evaluations…');
      await wipeCollection(db, 'evaluations');

      setProgress('Clearing students…');
      await wipeCollection(db, 'students');

      setProgress('Clearing companies…');
      await wipeCollection(db, 'companies');

      setProgress('Clearing users…');
      await wipeCollection(db, 'users');
      // authAccounts is intentionally NOT wiped

      // Get UIDs by signing in via REST (accounts stay in Auth)
      setProgress('Fetching account UIDs…');
      const uids: Record<string, string> = {};
      for (const acc of RESET_DEMO_ACCOUNTS) {
        try {
          uids[acc.role] = await createUserViaRest(API_KEY, acc.email, acc.password);
        } catch (e) {
          if ((e as Error).message.includes('EMAIL_EXISTS')) {
            uids[acc.role] = await getUidViaRest(API_KEY, acc.email, acc.password);
          } else {
            throw e;
          }
        }
      }

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
      const endStr = endDate.toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const t2 = twoDaysAgo.toISOString().split('T')[0];

      setProgress('Restoring user profiles…');
      if (uids.student) await setDoc(doc(db, 'users', uids.student), { name: 'Juan dela Cruz', email: 'juan.delacruz@ndkc-ojt.com', role: 'student', department: 'CTELAN — College of Teacher Education, Language & Natural Sciences', status: 'active', joinedAt: today });
      if (uids.supervisor) await setDoc(doc(db, 'users', uids.supervisor), { name: 'Maria Santos', email: 'maria.santos@ndkc-ojt.com', role: 'supervisor', company: 'Notre Dame Technology Hub', status: 'active', joinedAt: today });
      if (uids.coordinator) await setDoc(doc(db, 'users', uids.coordinator), { name: 'Dr. Roberto Reyes', email: 'roberto.reyes@ndkc-ojt.com', role: 'coordinator', department: 'CTELAN — College of Teacher Education, Language & Natural Sciences', status: 'active', joinedAt: today });
      if (uids.admin) await setDoc(doc(db, 'users', uids.admin), { name: 'OJT System Admin', email: 'admin@ndkc-ojt.com', role: 'admin', department: 'IT Services', status: 'active', joinedAt: today });

      // Ensure demo accounts are in registry
      for (const acc of RESET_DEMO_ACCOUNTS) {
        if (uids[acc.role]) await setDoc(doc(db, 'authAccounts', uids[acc.role]), { email: acc.email, createdAt: today }, { merge: true });
      }

      setProgress('Restoring companies…');
      await setDoc(doc(db, 'companies', 'ndkc-tech-hub'), { name: 'Notre Dame Technology Hub', industry: 'Information Technology', location: 'Notre Dame of Kidapawan College, Kidapawan City', contactPerson: 'Maria Santos', studentsAssigned: 1, status: 'active' });
      await setDoc(doc(db, 'companies', 'globalink-solutions'), { name: 'GlobalInk Solutions', industry: 'Software Development', location: 'Cotabato City', contactPerson: 'Carlo Dela Cruz', studentsAssigned: 0, status: 'active' });

      setProgress('Restoring student profile…');
      if (uids.student && uids.supervisor && uids.coordinator) {
        await setDoc(doc(db, 'students', uids.student), {
          name: 'Juan dela Cruz', email: 'juan.delacruz@ndkc-ojt.com',
          company: 'Notre Dame Technology Hub', companyId: 'ndkc-tech-hub',
          supervisorId: uids.supervisor, supervisorName: 'Maria Santos',
          coordinatorId: uids.coordinator,
          program: 'BS Information Technology', yearSection: '4IT-A',
          requiredHours: 500, completedHours: 0,
          startDate: today, endDate: endStr,
          status: 'active', phone: '09171234567', department: 'CTELAN',
        });
      }

      setProgress('Restoring journal entries…');
      if (uids.student && uids.supervisor) {
        await setDoc(doc(db, 'journalEntries', 'je_sample_1'), {
          studentId: uids.student, studentName: 'Juan dela Cruz', supervisorId: uids.supervisor,
          date: yStr, timeIn: '08:00', timeOut: '17:00', hoursRendered: 8,
          tasks: 'Attended morning orientation and briefing. Assisted IT team with hardware inventory documentation. Set up workstations for new hires and configured their software environments. Participated in afternoon team meeting.',
          skillsDeveloped: ['IT Support', 'Documentation', 'Hardware Setup'],
          challenges: 'Configuring network settings for new workstations took longer than expected due to domain policy restrictions.',
          status: 'pending', submittedAt: new Date().toISOString(), attachments: [],
        });
        await setDoc(doc(db, 'journalEntries', 'je_sample_2'), {
          studentId: uids.student, studentName: 'Juan dela Cruz', supervisorId: uids.supervisor,
          date: t2, timeIn: '08:00', timeOut: '17:00', hoursRendered: 8,
          tasks: 'Worked on the company internal helpdesk system. Resolved 5 support tickets related to printer and email configuration. Documented solutions in the internal knowledge base. Assisted senior developer with code review for the ticketing module.',
          skillsDeveloped: ['Helpdesk Support', 'Technical Writing', 'Code Review'],
          challenges: 'Encountered a compatibility issue between the legacy ticketing system and the new email client. Resolved by updating the SMTP settings.',
          status: 'approved', supervisorFeedback: 'Good work today, Juan! Your documentation was thorough and your approach to the support tickets was methodical. Keep it up.',
          submittedAt: new Date().toISOString(), reviewedAt: new Date().toISOString(), attachments: [],
        });
      }

      setProgress('Done!');
      setResetDone(true);
      setConfirm('');
      await refreshData();
      onReset();
    } catch (e) {
      setResetError((e as Error).message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(186,26,26,0.3)' }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #ffdad6', background: '#FFF5F5' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ffdad6' }}>
          <Trash2 size={16} style={{ color: '#ba1a1a' }} />
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#991B1B' }}>Reset Database</p>
          <p style={{ fontSize: '0.7rem', color: '#ba1a1a' }}>Wipes all Firestore data and restores demo accounts only</p>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        {resetDone && (
          <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <CheckCircle2 size={15} style={{ color: '#059669' }} />
            <p style={{ fontSize: '0.8rem', color: '#065F46', fontWeight: 500 }}>Database reset successfully. All data has been restored to defaults.</p>
          </div>
        )}
        {resetError && (
          <div className="p-3 rounded-xl" style={{ background: '#ffdad6', border: '1px solid #ffdad6' }}>
            <p style={{ fontSize: '0.8rem', color: '#93000a' }}>{resetError}</p>
          </div>
        )}
        {resetting && progress && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <Loader2 size={13} className="animate-spin" style={{ color: '#EA580C', flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', color: '#C2410C' }}>{progress}</p>
          </div>
        )}
        <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: '#FEF9C3', border: '1px solid #FDE047' }}>
          <AlertTriangle size={14} style={{ color: '#CA8A04', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '0.78rem', color: '#713F12', lineHeight: 1.6 }}>
            This will <strong>permanently delete</strong> all users, students, journal entries, evaluations, and companies from Firestore. The 4 demo Auth accounts are kept but their profiles are reset.
          </p>
        </div>
        <div className="space-y-1.5">
          <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#464553' }}>
            Type <strong style={{ fontFamily: 'monospace' }}>RESET</strong> to confirm
          </label>
          <input
            type="text"
            placeholder="RESET"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            disabled={resetting}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: `1px solid ${confirm === 'RESET' ? '#ba1a1a' : '#c8c4d5'}`, background: '#eff4ff', fontSize: '0.875rem', fontFamily: 'monospace', outline: 'none', color: '#0d1c2e' }}
          />
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={confirm !== 'RESET' || resetting}
          className="w-full py-2.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: '#ba1a1a', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          {resetting ? <><Loader2 size={13} className="animate-spin" /> Resetting…</> : <><Trash2 size={13} /> Reset All Data</>}
        </button>
      </div>
    </div>
  );
}

function SystemSettings({ onReset }: { onReset: () => void }) {
  const [notifs, setNotifs] = useState({ emailNew: true, emailApproval: true, smsReminder: false, weeklyReport: true });
  const [saved, setSaved] = useState(false);
  const [requiredHours, setRequiredHours] = useState('500');
  const [minEntryLength, setMinEntryLength] = useState('50');
  const [cloudName, setCloudName] = useState(getCloudinaryCloudName());
  const [cloudSaved, setCloudSaved] = useState(false);

  const saveCloud = () => {
    saveCloudinaryCloudName(cloudName.trim() || DEFAULT_CLOUDINARY_CLOUD_NAME);
    setCloudName(cloudName.trim() || DEFAULT_CLOUDINARY_CLOUD_NAME);
    setCloudSaved(true);
    setTimeout(() => setCloudSaved(false), 2000);
  };

  const sections = [
    {
      icon: Cloud, title: 'Cloudinary (File Uploads)', description: 'Configure your Cloudinary cloud name for image uploads',
      content: (
        <div className="space-y-3">
          <div className="p-3 rounded-lg" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <p style={{ fontSize: '0.78rem', color: '#065F46' }}>
              Cloud name: <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>dhk6bnzht</strong> · API Key: <strong>946282315351968</strong> · Uploads go to <strong>ojt-journals</strong> folder
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="dhk6bnzht"
              value={cloudName}
              onChange={e => setCloudName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border text-sm"
              style={{ border: '1px solid #c8c4d5', background: '#eff4ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.83rem', color: '#0d1c2e' }}
            />
            <button
              type="button"
              onClick={saveCloud}
              className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors"
              style={{ background: cloudSaved ? '#059669' : '#006a61', cursor: 'pointer' }}
            >
              {cloudSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </div>
      ),
    },
    {
      icon: Bell, title: 'Notifications', description: 'Configure system-wide notification settings',
      content: (
        <div className="space-y-4">
          {[
            { key: 'emailNew',      label: 'Email on new journal submission',  sub: 'Notify supervisor when student submits entry' },
            { key: 'emailApproval', label: 'Email on approval/rejection',       sub: 'Notify student when entry is reviewed' },
            { key: 'smsReminder',   label: 'SMS reminders',                     sub: "Send SMS to students who haven't submitted" },
            { key: 'weeklyReport',  label: 'Weekly summary report',             sub: 'Send coordinators a weekly progress digest' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p style={{ fontSize: '0.83rem', fontWeight: 500, color: '#0d1c2e' }}>{item.label}</p>
                <p style={{ fontSize: '0.72rem', color: '#777584' }}>{item.sub}</p>
              </div>
              <Switch
                checked={notifs[item.key as keyof typeof notifs]}
                onCheckedChange={() => setNotifs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof notifs] }))}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Database, title: 'OJT Requirements', description: 'Configure required training hours and entry settings',
      content: (
        <div className="space-y-4">
          {[
            { label: 'Required OJT Hours',    value: requiredHours,    onChange: setRequiredHours,    sub: 'Minimum hours for OJT completion' },
            { label: 'Minimum Entry Length',  value: minEntryLength,   onChange: setMinEntryLength,   sub: 'Minimum characters in tasks description' },
          ].map(f => (
            <div key={f.label} className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p style={{ fontSize: '0.83rem', fontWeight: 500, color: '#0d1c2e' }}>{f.label}</p>
                <p style={{ fontSize: '0.72rem', color: '#777584' }}>{f.sub}</p>
              </div>
              <input
                type="number"
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-lg border text-center"
                style={{ fontSize: '0.85rem', fontWeight: 600, border: '1px solid #c8c4d5', background: '#eff4ff', color: '#0d1c2e', fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Globe, title: 'Academic Year', description: 'Set the current academic year and OJT period',
      content: (
        <div className="space-y-4">
          {[
            { label: 'Academic Year',  value: '2025–2026' },
            { label: 'OJT Period',     value: 'March 1 – September 30, 2026' },
            { label: 'Institution',    value: 'Notre Dame of Kidapawan College' },
          ].map(f => (
            <div key={f.label} className="flex items-center justify-between gap-4">
              <p style={{ fontSize: '0.83rem', fontWeight: 500, color: '#0d1c2e' }}>{f.label}</p>
              <p style={{ fontSize: '0.82rem', color: '#464553' }}>{f.value}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Lock, title: 'Security', description: 'Authentication and access control settings',
      content: (
        <div className="space-y-4">
          {[
            { label: 'Firebase Authentication', sub: 'Email/password auth via Firebase', enabled: true },
            { label: 'Session Timeout',          sub: 'Auto-logout after 2 hours of inactivity', enabled: true },
            { label: 'Audit Logging',            sub: 'Log all user actions for review', enabled: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <div>
                <p style={{ fontSize: '0.83rem', fontWeight: 500, color: '#0d1c2e' }}>{item.label}</p>
                <p style={{ fontSize: '0.72rem', color: '#777584' }}>{item.sub}</p>
              </div>
              <Switch checked={item.enabled} />
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      {saved && (
        <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
          <CheckCircle2 size={17} style={{ color: '#059669' }} />
          <p style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: 500 }}>Settings saved!</p>
        </div>
      )}
      {sections.map(section => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#e6eeff' }}>
                <Icon size={16} style={{ color: '#464553' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0d1c2e' }}>{section.title}</p>
                <p style={{ fontSize: '0.7rem', color: '#777584' }}>{section.description}</p>
              </div>
            </div>
            <div className="px-5 py-4">{section.content}</div>
          </div>
        );
      })}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSaved(true)}
          className="px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: '#006a61', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Save Settings
        </button>
      </div>

      <ResetDatabaseSection onReset={onReset} />
    </div>
  );
}

function AdminReports() {
  const { data } = useAuth();
  const totalEntries = data.journalEntries.length;
  const approved = data.journalEntries.filter(e => e.status === 'approved').length;
  const pending  = data.journalEntries.filter(e => e.status === 'pending').length;
  const rejected = data.journalEntries.filter(e => e.status === 'rejected').length;
  const monthlyData = buildMonthlySubmissionsData(data.journalEntries);
  const roleData = buildRoleDistributionData(data.allUsers);

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Entries', value: totalEntries.toString(), color: '#0d1c2e' },
          { label: 'Approved',      value: approved.toString(),     color: '#059669' },
          { label: 'Pending',       value: pending.toString(),      color: '#D97706' },
          { label: 'Rejected',      value: rejected.toString(),     color: '#ba1a1a' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 text-center" style={{ border: '1px solid #c8c4d5' }}>
            <p style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
            <p style={{ fontSize: '0.7rem', color: '#464553', marginTop: '2px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-5" style={{ border: '1px solid #c8c4d5' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e', marginBottom: '12px' }}>Monthly Submissions Trend</p>
        <ResponsiveContainer key="rep-trend-rc" width="100%" height={220}>
          <BarChart key="rep-trend-bc" data={monthlyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid key="rep-t-grid" strokeDasharray="3 3" vertical={false} stroke="#e6eeff" />
            <XAxis key="rep-t-x" dataKey="month" tick={{ fontSize: 11, fill: '#777584' }} axisLine={false} tickLine={false} />
            <YAxis key="rep-t-y" tick={{ fontSize: 11, fill: '#777584' }} axisLine={false} tickLine={false} />
            <Tooltip key="rep-t-tip" contentStyle={{ borderRadius: '6px', border: '1px solid #c8c4d5', boxShadow: '0 4px 16px #c8c4d5', fontSize: '12px' }} />
            <Bar key="rep-t-approved" dataKey="approved" fill="#006a61" radius={[4, 4, 0, 0]} maxBarSize={28} name="Approved" />
            <Bar key="rep-t-pending"  dataKey="pending"  fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={28} name="Pending" />
            <Bar key="rep-t-rejected" dataKey="rejected" fill="#ba1a1a" radius={[4, 4, 0, 0]} maxBarSize={28} name="Rejected" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid #c8c4d5' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e', marginBottom: '8px' }}>User Role Breakdown</p>
          <ResponsiveContainer key="rep-pie-rc" width="100%" height={180}>
            <PieChart key="rep-pie-pc">
              <Pie key="rep-pie-p" data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={30}>
                {roleData.map((entry) => <Cell key={`rep-pie-cell-${entry.name}`} fill={entry.color} />)}
              </Pie>
              <Tooltip key="rep-pie-tip" contentStyle={{ borderRadius: '6px', border: '1px solid #c8c4d5', boxShadow: '0 4px 16px #c8c4d5', fontSize: '12px' }} />
              <Legend key="rep-pie-leg" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Student Completion Status</p>
          </div>
          {data.students.length === 0 ? (
            <div className="p-6 text-center"><p style={{ fontSize: '0.82rem', color: '#777584' }}>No students yet.</p></div>
          ) : data.students.map((s, i) => {
            const pct = s.requiredHours > 0 ? Math.round((s.completedHours / s.requiredHours) * 100) : 0;
            return (
              <div key={s.id}>
                {i > 0 && <div style={{ height: '1px', background: '#eff4ff' }} />}
                <div className="px-5 py-3 flex items-center gap-3">
                  <span className="flex-1 truncate" style={{ fontSize: '0.82rem', fontWeight: 500, color: '#0d1c2e' }}>{s.name}</span>
                  <div className="flex items-center gap-2" style={{ width: '120px' }}>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#e6eeff', height: '6px' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#059669' : '#006a61', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#006a61', flexShrink: 0, minWidth: '32px', fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AdminModule({ page, onNavigate }: { page: string; onNavigate: (p: string) => void }) {
  if (page === 'users') return <UserManagement />;
  if (page === 'companies') return <Companies />;
  if (page === 'settings') return <SystemSettings onReset={() => onNavigate('dashboard')} />;
  if (page === 'reports') return <AdminReports />;
  return <AdminDashboard onNavigate={onNavigate} />;
}
