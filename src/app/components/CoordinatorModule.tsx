import { useState, useEffect } from 'react';
import {
  GraduationCap, Building2, CheckCircle2, Download, Loader2,
  TrendingUp, ChevronRight, MapPin, Phone, Mail, Calendar, Star, ClipboardList,
} from 'lucide-react';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { Progress } from './ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import type { AppUser } from '../contexts/AuthContext';

function StatusBadge({ status }: { status: 'active' | 'completed' | 'not-started' }) {
  const cfg = {
    active:        { label: 'Active',       bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
    completed:     { label: 'Completed',    bg: '#e6eeff', color: '#1f108e', dot: '#3B82F6' },
    'not-started': { label: 'Not Started',  bg: '#e6eeff', color: '#464553', dot: '#777584' },
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: cfg.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      <span style={{ color: cfg.color, fontSize: '0.7rem', fontWeight: 600 }}>{cfg.label}</span>
    </span>
  );
}

function CoordinatorDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { data } = useAuth();
  const students = data.students;
  const activeStudents = students.filter(s => s.status === 'active');
  const completedStudents = students.filter(s => s.status === 'completed');
  const avgCompletion = students.length > 0
    ? Math.round(students.reduce((a, s) => a + (s.requiredHours > 0 ? s.completedHours / s.requiredHours : 0), 0) / students.length * 100)
    : 0;

  const chartData = students.map(s => ({
    name: s.name.split(' ')[0],
    completed: s.completedHours,
    remaining: Math.max(0, s.requiredHours - s.completedHours),
    pct: s.requiredHours > 0 ? Math.round((s.completedHours / s.requiredHours) * 100) : 0,
  }));

  const stats = [
    { label: 'Active Students', value: activeStudents.length.toString(), sub: 'currently training', iconBg: '#D1FAE5', iconColor: '#059669', icon: GraduationCap },
    { label: 'Avg Completion',  value: `${avgCompletion}%`,             sub: 'across all students', iconBg: '#FEF3C7', iconColor: '#D97706', icon: TrendingUp },
    { label: 'Companies',       value: new Set(students.map(s => s.companyId)).size.toString(), sub: 'partner institutions', iconBg: '#E0F2FE', iconColor: '#0369A1', icon: Building2 },
    { label: 'OJT Completed',   value: completedStudents.length.toString(), sub: 'students finished', iconBg: '#EEF2FF', iconColor: '#6366F1', icon: CheckCircle2 },
  ];

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

      {/* Chart */}
      {students.length > 0 && (
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid #c8c4d5' }}>
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Student OJT Completion</p>
            <button type="button" onClick={() => onNavigate('students')} className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: '#006a61', fontWeight: 500 }}>
              View details <ChevronRight size={13} />
            </button>
          </div>
          <ResponsiveContainer key="crd-comp-rc" width="100%" height={200}>
            <BarChart key="crd-comp-bc" data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid key="crd-c-grid" strokeDasharray="3 3" vertical={false} stroke="#e6eeff" />
              <XAxis key="crd-c-x" dataKey="name" tick={{ fontSize: 11, fill: '#777584' }} axisLine={false} tickLine={false} />
              <YAxis key="crd-c-y" tick={{ fontSize: 11, fill: '#777584' }} axisLine={false} tickLine={false} domain={[0, 500]} />
              <Tooltip
                key="crd-c-tip"
                contentStyle={{ borderRadius: '6px', border: '1px solid #c8c4d5', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                formatter={(v: number, name: string) => [`${v}h`, name === 'completed' ? 'Completed' : 'Remaining']}
              />
              <Bar key="crd-c-completed" dataKey="completed" fill="#006a61" radius={[4, 4, 0, 0]} maxBarSize={36} name="Completed" />
              <Bar key="crd-c-remaining" dataKey="remaining" fill="#c8c4d5" radius={[4, 4, 0, 0]} maxBarSize={36} name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 justify-center">
            {[{ color: '#006a61', label: 'Completed hours' }, { color: '#c8c4d5', label: 'Remaining hours', border: '1px solid #c8c4d5' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: l.color, border: l.border }} />
                <span style={{ fontSize: '0.72rem', color: '#777584' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress overview */}
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Student Progress Overview</p>
        </div>
        {students.length === 0 ? (
          <div className="p-8 text-center"><p style={{ fontSize: '0.82rem', color: '#777584' }}>No students assigned to your coordination yet.</p></div>
        ) : students.map((s, i) => {
          const pct = s.requiredHours > 0 ? Math.round((s.completedHours / s.requiredHours) * 100) : 0;
          return (
            <div key={s.id}>
              {i > 0 && <div style={{ height: '1px', background: '#eff4ff' }} />}
              <div className="px-5 py-4 flex items-center gap-4 flex-wrap"
                onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                  style={{ background: '#0d1c2e', fontSize: '0.78rem', fontWeight: 700 }}
                >
                  {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontWeight: 600, fontSize: '0.87rem', color: '#0d1c2e' }}>{s.name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#777584' }}>{s.company} · {s.supervisorName}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#006a61', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0d1c2e', fontFamily: "'JetBrains Mono', monospace" }}>{s.completedHours}h</p>
                  <p style={{ fontSize: '0.67rem', color: '#777584' }}>of {s.requiredHours}h</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Students() {
  const { data } = useAuth();
  return (
    <div className="p-6 space-y-5">
      {data.students.length === 0 ? (
        <div className="bg-card rounded-xl p-10 text-center" style={{ border: '1px solid #c8c4d5' }}>
          <p style={{ fontSize: '0.82rem', color: '#777584' }}>No students assigned yet.</p>
        </div>
      ) : data.students.map(s => {
        const pct = s.requiredHours > 0 ? Math.round((s.completedHours / s.requiredHours) * 100) : 0;
        const entries = data.journalEntries.filter(e => e.studentId === s.id);
        return (
          <div key={s.id} className="bg-card rounded-xl p-5" style={{ border: '1px solid #c8c4d5' }}>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: '#0d1c2e', fontSize: '0.92rem', fontWeight: 700 }}
              >
                {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d1c2e' }}>{s.name}</p>
                    <p style={{ fontSize: '0.7rem', color: '#777584' }}>{s.program} · {s.yearSection}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {[
                    { icon: Building2, text: s.company },
                    { icon: Mail,      text: s.email },
                    { icon: Phone,     text: s.phone },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5">
                      <Icon size={12} style={{ color: '#777584', flexShrink: 0 }} />
                      <span className="truncate" style={{ fontSize: '0.72rem', color: '#464553' }}>{text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { label: 'Completed', value: `${s.completedHours}h`, color: '#006a61' },
                    { label: 'Remaining', value: `${Math.max(0, s.requiredHours - s.completedHours)}h`, color: '#D97706' },
                    { label: 'Journals',  value: `${entries.length}`, color: '#0369A1' },
                    { label: 'Approved',  value: `${entries.filter(e => e.status === 'approved').length}`, color: '#059669' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center p-2.5 rounded-xl" style={{ background: '#eff4ff', border: '1px solid #e6eeff' }}>
                      <p style={{ fontSize: '0.98rem', fontWeight: 700, color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</p>
                      <p style={{ fontSize: '0.65rem', color: '#777584' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Progress value={pct} className="h-2 flex-1" />
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#006a61', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{pct}% complete</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Calendar size={11} style={{ color: '#777584' }} />
                  <span style={{ fontSize: '0.7rem', color: '#777584' }}>
                    {new Date(s.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(s.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Placements() {
  const { data } = useAuth();
  const students = data.students;
  const companies = data.companies.filter(c => students.some(s => s.companyId === c.id));

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Placements', value: students.length.toString(), color: '#006a61' },
          { label: 'Active', value: students.filter(s => s.status === 'active').length.toString(), color: '#059669' },
          { label: 'Companies Used', value: new Set(students.map(s => s.companyId)).size.toString(), color: '#0369A1' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 text-center" style={{ border: '1px solid #c8c4d5' }}>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
            <p style={{ fontSize: '0.72rem', color: '#464553', marginTop: '2px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Student Placements</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8f9ff', borderBottom: '1px solid #e6eeff' }}>
                {['Student', 'Program', 'Company', 'Supervisor', 'Period', 'Progress', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '0.63rem', fontWeight: 700, color: '#777584', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const pct = s.requiredHours > 0 ? Math.round((s.completedHours / s.requiredHours) * 100) : 0;
                return (
                  <tr
                    key={s.id}
                    style={{ borderBottom: i < students.length - 1 ? '1px solid #eff4ff' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                          style={{ background: '#0d1c2e', fontSize: '0.63rem', fontWeight: 700 }}
                        >
                          {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0d1c2e', whiteSpace: 'nowrap' }}>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5" style={{ fontSize: '0.78rem', color: '#464553', whiteSpace: 'nowrap' }}>{s.yearSection}</td>
                    <td className="px-4 py-3.5" style={{ fontSize: '0.78rem', color: '#464553', whiteSpace: 'nowrap' }}>{s.company}</td>
                    <td className="px-4 py-3.5" style={{ fontSize: '0.78rem', color: '#464553', whiteSpace: 'nowrap' }}>{s.supervisorName}</td>
                    <td className="px-4 py-3.5" style={{ fontSize: '0.7rem', color: '#777584', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(s.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(s.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2" style={{ minWidth: '90px' }}>
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#006a61', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={s.status} /></td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ fontSize: '0.82rem', color: '#777584' }}>No placements yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {companies.length > 0 && (
        <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Partner Companies</p>
          </div>
          {companies.map((company, i) => (
            <div key={company.id}>
              {i > 0 && <div style={{ height: '1px', background: '#eff4ff' }} />}
              <div className="px-5 py-4 flex items-center gap-3"
                onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#e6eeff' }}>
                  <Building2 size={17} style={{ color: '#1f108e' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontWeight: 600, fontSize: '0.87rem', color: '#0d1c2e' }}>{company.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span style={{ fontSize: '0.7rem', color: '#777584' }}>{company.industry}</span>
                    <div className="flex items-center gap-1">
                      <MapPin size={10} style={{ color: '#777584' }} />
                      <span style={{ fontSize: '0.7rem', color: '#777584' }}>{company.location}</span>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>
                  {students.filter(s => s.companyId === company.id).length} student{students.filter(s => s.companyId === company.id).length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function exportToPDF(
  students: ReturnType<typeof useAuth>['data']['students'],
  entries:  ReturnType<typeof useAuth>['data']['journalEntries'],
  appUser:  AppUser | null
) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(13, 17, 23);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('OJT Track — Student Progress Report', 14, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated: ${dateStr}`, 14, 17);
  doc.text(`Coordinator: ${appUser?.name ?? '—'}`, 14, 22);

  // ── Summary stats ───────────────────────────────────────────────────────────
  const totalHours = students.reduce((a, s) => a + s.completedHours, 0);
  const approved   = entries.filter(e => e.status === 'approved').length;
  const pending    = entries.filter(e => e.status === 'pending').length;
  const avgPct     = students.length > 0
    ? Math.round(students.reduce((a, s) => a + (s.requiredHours > 0 ? s.completedHours / s.requiredHours : 0), 0) / students.length * 100)
    : 0;

  const stats = [
    { label: 'Total Students',   value: String(students.length) },
    { label: 'Total Hours',      value: `${totalHours}h` },
    { label: 'Avg Completion',   value: `${avgPct}%` },
    { label: 'Approved Entries', value: String(approved) },
    { label: 'Pending Entries',  value: String(pending) },
  ];

  let y = 36;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 17, 23);
  doc.text('Summary', 14, y);
  y += 4;

  const statBoxW = (pageW - 28 - (stats.length - 1) * 3) / stats.length;
  stats.forEach((s, i) => {
    const x = 14 + i * (statBoxW + 3);
    doc.setFillColor(242, 244, 248);
    doc.roundedRect(x, y, statBoxW, 16, 2, 2, 'F');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136);
    doc.text(s.value, x + statBoxW / 2, y + 7, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(s.label, x + statBoxW / 2, y + 13, { align: 'center' });
  });
  y += 22;

  // ── Student table ────────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 17, 23);
  doc.text('Student Summary', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [['Student', 'Program', 'Company', 'Supervisor', 'Hours Done', 'Required', 'Completion', 'Journals', 'Status']],
    body: students.map(s => {
      const pct = s.requiredHours > 0 ? Math.round((s.completedHours / s.requiredHours) * 100) : 0;
      const je  = entries.filter(e => e.studentId === s.id);
      return [
        s.name,
        s.program,
        s.company,
        s.supervisorName,
        `${s.completedHours}h`,
        `${s.requiredHours}h`,
        `${pct}%`,
        String(je.length),
        s.status.charAt(0).toUpperCase() + s.status.slice(1),
      ];
    }),
    headStyles: { fillColor: [13, 17, 23], textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 7, textColor: [55, 65, 81] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [17, 24, 39] },
      4: { halign: 'center', textColor: [13, 148, 136], fontStyle: 'bold' },
      5: { halign: 'center' },
      6: { halign: 'center', textColor: [13, 148, 136], fontStyle: 'bold' },
      7: { halign: 'center' },
      8: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    theme: 'grid',
  });

  // ── Per-student journal log ──────────────────────────────────────────────────
  students.forEach(s => {
    const je = entries.filter(e => e.studentId === s.id);
    if (je.length === 0) return;

    doc.addPage();

    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Journal Log — ${s.name}`, 14, 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text(`${s.program} · ${s.yearSection} · ${s.company}`, 14, 14);

    autoTable(doc, {
      startY: 22,
      head: [['Date', 'Time In', 'Time Out', 'Hours', 'Tasks / Activities', 'Status', 'Feedback']],
      body: je.map(e => [
        new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        e.timeIn,
        e.timeOut,
        `${e.hoursRendered}h`,
        e.tasks.length > 120 ? e.tasks.slice(0, 120) + '…' : e.tasks,
        e.status.charAt(0).toUpperCase() + e.status.slice(1),
        e.supervisorFeedback ? (e.supervisorFeedback.length > 80 ? e.supervisorFeedback.slice(0, 80) + '…' : e.supervisorFeedback) : '—',
      ]),
      headStyles: { fillColor: [13, 17, 23], textColor: 255, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.5, textColor: [55, 65, 81] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 13, halign: 'center' },
        2: { cellWidth: 13, halign: 'center' },
        3: { cellWidth: 10, halign: 'center', textColor: [13, 148, 136], fontStyle: 'bold' },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 35 },
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    });
  });

  // ── Footer on all pages ──────────────────────────────────────────────────────
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');
    doc.text('OJT Track Monitoring System — Notre Dame of Kidapawan College', 14, doc.internal.pageSize.getHeight() - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageW - 14, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
  }

  doc.save(`OJT_Report_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`);
}

function Reports() {
  const { data, appUser } = useAuth();
  const [exporting, setExporting] = useState(false);
  const students = data.students;
  const entries = data.journalEntries;
  const totalHours = students.reduce((a, s) => a + s.completedHours, 0);
  const approved = entries.filter(e => e.status === 'approved').length;
  const pending = entries.filter(e => e.status === 'pending').length;
  const chartData = students.map(s => ({ name: s.name.split(' ')[0], hours: s.completedHours, target: s.requiredHours }));

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPDF(students, entries, appUser);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex justify-end">
        <button type="button"
          onClick={handleExport}
          disabled={exporting || students.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: '#0d1c2e', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
        >
          {exporting ? <><Loader2 size={13} className="animate-spin" /> Generating PDF…</> : <><Download size={13} /> Export PDF</>}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Students',   value: students.length.toString(), color: '#0d1c2e' },
          { label: 'Total Hours',      value: `${totalHours}h`,           color: '#006a61' },
          { label: 'Approved Entries', value: approved.toString(),         color: '#059669' },
          { label: 'Pending Entries',  value: pending.toString(),          color: '#D97706' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 text-center" style={{ border: '1px solid #c8c4d5' }}>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
            <p style={{ fontSize: '0.7rem', color: '#464553', marginTop: '2px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid #c8c4d5' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e', marginBottom: '12px' }}>Hours Completed per Student</p>
          <ResponsiveContainer key="crd-rpt-rc" width="100%" height={200}>
            <BarChart key="crd-rpt-bc" data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid key="crd-r-grid" strokeDasharray="3 3" vertical={false} stroke="#e6eeff" />
              <XAxis key="crd-r-x" dataKey="name" tick={{ fontSize: 11, fill: '#777584' }} axisLine={false} tickLine={false} />
              <YAxis key="crd-r-y" tick={{ fontSize: 11, fill: '#777584' }} axisLine={false} tickLine={false} domain={[0, 550]} />
              <Tooltip
                key="crd-r-tip"
                contentStyle={{ borderRadius: '6px', border: '1px solid #c8c4d5', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                formatter={(v: number, name: string) => [`${v}h`, name === 'hours' ? 'Completed' : 'Target']}
              />
              <Bar key="crd-r-target" dataKey="target" fill="#e6eeff" radius={[4, 4, 0, 0]} maxBarSize={36} name="target" />
              <Bar key="crd-r-hours"  dataKey="hours"  fill="#006a61" radius={[4, 4, 0, 0]} maxBarSize={36} name="hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Individual Student Summary</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8f9ff', borderBottom: '1px solid #e6eeff' }}>
                {['Student', 'Company', 'Hours Done', 'Required', 'Completion', 'Journals', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '0.63rem', fontWeight: 700, color: '#777584', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const pct = s.requiredHours > 0 ? Math.round((s.completedHours / s.requiredHours) * 100) : 0;
                const se = entries.filter(e => e.studentId === s.id);
                return (
                  <tr
                    key={s.id}
                    style={{ borderBottom: i < students.length - 1 ? '1px solid #eff4ff' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-3" style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0d1c2e', whiteSpace: 'nowrap' }}>{s.name}</td>
                    <td className="px-4 py-3" style={{ fontSize: '0.78rem', color: '#464553', whiteSpace: 'nowrap' }}>{s.company}</td>
                    <td className="px-4 py-3" style={{ fontSize: '0.83rem', fontWeight: 700, color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>{s.completedHours}h</td>
                    <td className="px-4 py-3" style={{ fontSize: '0.78rem', color: '#464553', fontFamily: "'JetBrains Mono', monospace" }}>{s.requiredHours}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" style={{ minWidth: '80px' }}>
                        <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#e6eeff', height: '6px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#006a61', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: '0.78rem', color: '#464553', fontFamily: "'JetBrains Mono', monospace" }}>{se.length}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ fontSize: '0.82rem', color: '#777584' }}>No data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type EvalEntry = {
  supervisorId: string;
  ratings: Record<string, number>;
  comment: string;
};

function Evaluations() {
  const { data } = useAuth();
  const [evMap, setEvMap] = useState<Record<string, EvalEntry[]>>({});
  const [loading, setLoading] = useState(true);

  const criteria = [
    { id: 'work_ethic',    label: 'Work Ethic & Punctuality' },
    { id: 'technical',     label: 'Technical Skills' },
    { id: 'communication', label: 'Communication Skills' },
    { id: 'initiative',    label: 'Initiative & Proactiveness' },
    { id: 'teamwork',      label: 'Teamwork & Collaboration' },
  ];

  useEffect(() => {
    if (data.students.length === 0) { setLoading(false); return; }
    const studentIds = new Set(data.students.map(s => s.id));
    const db = getFirestore();
    const unsub = onSnapshot(collection(db, 'evaluations'), snap => {
      const grouped: Record<string, EvalEntry[]> = {};
      snap.docs.forEach(d => {
        const ev = d.data() as Record<string, unknown>;
        const sid = ev.studentId as string;
        if (!studentIds.has(sid)) return;
        if (!grouped[sid]) grouped[sid] = [];
        grouped[sid].push({
          supervisorId: (ev.supervisorId ?? '') as string,
          ratings: (ev.ratings ?? {}) as Record<string, number>,
          comment: (ev.comment ?? '') as string,
        });
      });
      setEvMap(grouped);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.students.length]);

  const ratingLabel = (r: number) => ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][r] ?? '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const studentsWithEvals = data.students.filter(s => (evMap[s.id] ?? []).length > 0);
  const studentsWithout = data.students.filter(s => !(evMap[s.id] ?? []).length);

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Students', value: data.students.length.toString(), color: '#006a61' },
          { label: 'Evaluated',      value: studentsWithEvals.length.toString(), color: '#059669' },
          { label: 'Pending Eval',   value: studentsWithout.length.toString(), color: '#D97706' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 text-center" style={{ border: '1px solid #c8c4d5' }}>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
            <p style={{ fontSize: '0.72rem', color: '#464553', marginTop: '2px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {data.students.length === 0 ? (
        <div className="bg-card rounded-xl p-10 text-center" style={{ border: '1px solid #c8c4d5' }}>
          <p style={{ fontSize: '0.82rem', color: '#777584' }}>No students assigned yet.</p>
        </div>
      ) : data.students.map(s => {
        const evals = evMap[s.id] ?? [];
        return (
          <div key={s.id} className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: '#0d1c2e', fontSize: '0.78rem', fontWeight: 700 }}>
                {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0d1c2e' }}>{s.name}</p>
                <p style={{ fontSize: '0.7rem', color: '#777584' }}>{s.program} · {s.yearSection} · {s.company}</p>
              </div>
              {evals.length === 0 ? (
                <span className="px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: '#FEF3C7', fontSize: '0.7rem', fontWeight: 600, color: '#92400E' }}>
                  No evaluation yet
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: '#D1FAE5', fontSize: '0.7rem', fontWeight: 600, color: '#065F46' }}>
                  {evals.length} evaluation{evals.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {evals.length === 0 ? (
              <div className="px-5 py-6 flex items-center gap-3" style={{ background: '#fafbff' }}>
                <ClipboardList size={16} style={{ color: '#c8c4d5', flexShrink: 0 }} />
                <p style={{ fontSize: '0.8rem', color: '#777584' }}>Supervisor has not submitted an evaluation for this student yet.</p>
              </div>
            ) : evals.map((ev, ei) => (
              <div key={ei}>
                {ei > 0 && <div style={{ height: '1px', background: '#eff4ff' }} />}
                <div className="px-5 py-4 space-y-3">
                  {criteria.map(c => {
                    const rating = ev.ratings[c.id] ?? 0;
                    return (
                      <div key={c.id} className="flex items-center gap-4 flex-wrap">
                        <span className="flex-1 min-w-[140px]" style={{ fontSize: '0.82rem', color: '#464553' }}>{c.label}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} size={16}
                              style={{ color: star <= rating ? '#F59E0B' : '#c8c4d5', fill: star <= rating ? '#F59E0B' : '#eff4ff' }} />
                          ))}
                          <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: rating > 0 ? '#006a61' : '#777584', fontWeight: rating > 0 ? 600 : 400, minWidth: '60px' }}>
                            {rating === 0 ? 'Not rated' : ratingLabel(rating)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {ev.comment && (
                    <div className="mt-2 p-3 rounded-xl" style={{ background: '#eff4ff', border: '1px solid #e6eeff' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#777584', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Supervisor Comments</p>
                      <p style={{ fontSize: '0.83rem', color: '#464553', lineHeight: 1.6 }}>{ev.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function CoordinatorModule({ page, onNavigate }: { page: string; onNavigate: (p: string) => void }) {
  if (page === 'students') return <Students />;
  if (page === 'placements') return <Placements />;
  if (page === 'reports') return <Reports />;
  if (page === 'evaluations') return <Evaluations />;
  return <CoordinatorDashboard onNavigate={onNavigate} />;
}
