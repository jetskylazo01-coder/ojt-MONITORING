import { useState, useRef } from 'react';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, Send, Save,
  Upload, BookOpen, ChevronDown, ChevronUp, FileText, ArrowRight,
  Target, Loader2, X, ImageIcon,
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { buildWeeklyHoursData } from '../mockData';
import { uploadToCloudinary } from '../services/cloudinary';

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const cfg = {
    pending:  { label: 'Pending',  bg: '#FEF3C7', color: '#92400E', dot: '#D97706' },
    approved: { label: 'Approved', bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
    rejected: { label: 'Rejected', bg: '#ffdad6', color: '#93000a', dot: '#ba1a1a' },
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: cfg.bg }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      <span style={{ color: cfg.color, fontSize: '0.7rem', fontWeight: 600 }}>{cfg.label}</span>
    </span>
  );
}

function StatCard({ label, value, sub, iconBg, iconColor, icon: Icon }: {
  label: string; value: string; sub: string; iconBg: string; iconColor: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}) {
  return (
    <div className="bg-card rounded-xl p-4" style={{ border: '1px solid #c8c4d5' }}>
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 500, color: '#464553', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: '1.7rem', fontWeight: 700, color: '#0d1c2e', lineHeight: 1.1, marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
          <p style={{ fontSize: '0.67rem', color: '#777584', marginTop: '2px' }}>{sub}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

function StudentDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { appUser, data } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const student = data.students[0];
  const entries = data.journalEntries.slice(0, 4);

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText size={28} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground" style={{ fontSize: '0.85rem' }}>Student profile not found. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  const progressPct = student.requiredHours > 0 ? Math.round((student.completedHours / student.requiredHours) * 100) : 0;
  const weeklyData = buildWeeklyHoursData(data.journalEntries);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: '#0d1c2e', letterSpacing: '-0.01em' }}>
            Good morning, {(appUser?.name ?? student.name).split(' ')[0]}!
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#464553', marginTop: '2px' }}>
            {student.company} · {student.program} · {student.yearSection}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('new-journal')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-all"
          style={{ background: '#006a61', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#005049'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#006a61'; }}
        >
          <BookOpen size={14} /> Log Today
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Hours Completed" value={`${student.completedHours}`} sub={`of ${student.requiredHours} required`} iconBg="#E0F2FE" iconColor="#0369A1" icon={Clock} />
        <StatCard label="Hours Remaining" value={`${Math.max(0, student.requiredHours - student.completedHours)}`} sub="hours left" iconBg="#FEF3C7" iconColor="#D97706" icon={Target} />
        <StatCard label="Entries Submitted" value={`${data.journalEntries.length}`} sub="total journals" iconBg="#D1FAE5" iconColor="#059669" icon={FileText} />
        <StatCard label="Pending Review" value={`${data.journalEntries.filter(e => e.status === 'pending').length}`} sub="awaiting approval" iconBg="#ffdad6" iconColor="#ba1a1a" icon={AlertCircle} />
      </div>

      {/* Progress + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Progress card */}
        <div className="bg-card rounded-xl p-5 lg:col-span-2" style={{ border: '1px solid #c8c4d5' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e', marginBottom: '16px' }}>OJT Progress</p>
          <div className="flex flex-col items-center py-2">
            <div className="relative w-28 h-28 mb-4">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e6eeff" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#006a61" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - progressPct / 100)}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>{progressPct}%</span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0d1c2e' }}>{student.completedHours} / {student.requiredHours} hrs</p>
            <p style={{ fontSize: '0.7rem', color: '#777584', marginTop: '2px' }}>hours completed</p>
          </div>
          <div className="mt-4 space-y-2.5 pt-4" style={{ borderTop: '1px solid #e6eeff' }}>
            {[
              { label: 'Company', value: student.company },
              { label: 'Supervisor', value: student.supervisorName },
              { label: 'End Date', value: new Date(student.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span style={{ fontSize: '0.72rem', color: '#777584' }}>{label}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#464553' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly chart */}
        <div className="bg-card rounded-xl p-5 lg:col-span-3" style={{ border: '1px solid #c8c4d5' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e', marginBottom: '12px' }}>This Week's Hours</p>
          <ResponsiveContainer key="stu-weekly-rc" width="100%" height={150}>
            <BarChart key="stu-weekly-bc" data={weeklyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid key="stu-w-grid" strokeDasharray="3 3" vertical={false} stroke="#e6eeff" />
              <XAxis key="stu-w-x" dataKey="day" tick={{ fontSize: 11, fill: '#777584' }} axisLine={false} tickLine={false} />
              <YAxis key="stu-w-y" tick={{ fontSize: 11, fill: '#777584' }} axisLine={false} tickLine={false} domain={[0, 10]} />
              <Tooltip
              key="stu-w-tip"
                contentStyle={{ borderRadius: '6px', border: '1px solid #c8c4d5', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                formatter={(v: number) => [`${v} hrs`, 'Hours']}
              />
              <Bar key="stu-w-hours" dataKey="hours" fill="#006a61" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-around mt-3 pt-3" style={{ borderTop: '1px solid #e6eeff' }}>
            {[
              { label: 'This Week', value: `${weeklyData.reduce((s, d) => s + d.hours, 0)}h` },
              { label: 'Days Present', value: weeklyData.filter(d => d.hours > 0).length.toString() },
              { label: 'Avg / Day', value: (() => { const days = weeklyData.filter(d => d.hours > 0); return days.length > 0 ? `${(days.reduce((s, d) => s + d.hours, 0) / days.length).toFixed(1)}h` : '0h'; })() },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
                <p style={{ fontSize: '0.67rem', color: '#777584' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent entries */}
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Recent Journal Entries</p>
          <button
            type="button"
            onClick={() => onNavigate('my-journals')}
            className="flex items-center gap-1 transition-colors"
            style={{ fontSize: '0.75rem', fontWeight: 500, color: '#006a61', cursor: 'pointer' }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        {entries.length === 0 ? (
          <div className="p-10 text-center">
            <p style={{ fontSize: '0.82rem', color: '#777584' }}>No journal entries yet. Start logging your daily activities!</p>
          </div>
        ) : entries.map((entry, i) => (
          <div key={entry.id}>
            {i > 0 && <div style={{ height: '1px', background: '#eff4ff' }} />}
            <div
              className="px-5 py-3.5 cursor-pointer transition-colors"
              style={{ background: expanded === entry.id ? '#f8f9ff' : 'transparent' }}
              onMouseEnter={e => { if (expanded !== entry.id) e.currentTarget.style.background = '#f8f9ff'; }}
              onMouseLeave={e => { if (expanded !== entry.id) e.currentTarget.style.background = 'transparent'; }}
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontWeight: 600, fontSize: '0.83rem', color: '#0d1c2e' }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#777584', fontFamily: "'JetBrains Mono', monospace" }}>
                      {entry.timeIn}–{entry.timeOut} · {entry.hoursRendered}h
                    </span>
                  </div>
                  <p style={{ fontSize: '0.77rem', color: '#464553', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.tasks}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.status} />
                  {expanded === entry.id ? <ChevronUp size={14} style={{ color: '#777584' }} /> : <ChevronDown size={14} style={{ color: '#777584' }} />}
                </div>
              </div>
              {expanded === entry.id && (
                <div className="mt-3 pt-3 space-y-2.5" style={{ borderTop: '1px solid #e6eeff' }}>
                  <p style={{ fontSize: '0.82rem', color: '#464553', lineHeight: 1.65 }}>{entry.tasks}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.skillsDeveloped.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md" style={{ background: '#e6eeff', color: '#1f108e', fontSize: '0.68rem', fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                  {entry.supervisorFeedback && (
                    <div className="p-3 rounded-lg" style={{ background: entry.status === 'approved' ? '#D1FAE5' : '#ffdad6', border: `1px solid ${entry.status === 'approved' ? '#A7F3D0' : '#ba1a1a'}` }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: entry.status === 'approved' ? '#15803D' : '#ba1a1a', marginBottom: '3px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Supervisor Feedback</p>
                      <p style={{ fontSize: '0.8rem', color: entry.status === 'approved' ? '#166534' : '#93000a', lineHeight: 1.55 }}>{entry.supervisorFeedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DRAFT_KEY = 'ojt_journal_draft';

function JournalForm({ onSubmit }: { onSubmit: () => void }) {
  const { appUser, data, submitJournalEntry } = useAuth();
  const student = data.students[0];
  const today = new Date().toISOString().split('T')[0];

  const loadDraft = () => {
    try { const r = localStorage.getItem(DRAFT_KEY); if (r) return JSON.parse(r); } catch {}
    return null;
  };
  const draft = loadDraft();

  const [form, setForm] = useState({
    date: draft?.date ?? today,
    timeIn: draft?.timeIn ?? '08:00',
    timeOut: draft?.timeOut ?? '17:00',
    tasks: draft?.tasks ?? '',
    skills: draft?.skills ?? '',
    challenges: draft?.challenges ?? '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [attachments, setAttachments] = useState<{ file: File; url?: string; uploading: boolean; error?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const hoursRendered = () => {
    if (!form.timeIn || !form.timeOut) return 0;
    const [ih, im] = form.timeIn.split(':').map(Number);
    const [oh, om] = form.timeOut.split(':').map(Number);
    return Math.max(0, Math.round(((oh * 60 + om) - (ih * 60 + im) - 60) / 60 * 10) / 10);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newItems = files.map(f => ({ file: f, uploading: true }));
    setAttachments(prev => [...prev, ...newItems]);
    for (const file of files) {
      try {
        const { url } = await uploadToCloudinary(file);
        setAttachments(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(a => a.file === file && a.uploading && !a.url);
          if (idx !== -1) copy[idx] = { ...copy[idx], url, uploading: false };
          return copy;
        });
      } catch (err) {
        setAttachments(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(a => a.file === file && a.uploading && !a.url);
          if (idx !== -1) copy[idx] = { ...copy[idx], uploading: false, error: (err as Error).message };
          return copy;
        });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!student) { setSubmitError('Student profile not found.'); return; }
    setSubmitting(true); setSubmitError('');
    try {
      await submitJournalEntry({
        studentId: appUser!.uid,
        studentName: appUser!.name,
        supervisorId: student.supervisorId,
        date: form.date,
        timeIn: form.timeIn,
        timeOut: form.timeOut,
        hoursRendered: hoursRendered(),
        tasks: form.tasks,
        skillsDeveloped: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        challenges: form.challenges,
        status: 'pending',
        attachments: attachments.filter(a => a.url).map(a => a.url!),
      });
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
      setTimeout(onSubmit, 2200);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6" style={{ minHeight: '420px' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#D1FAE5' }}>
          <CheckCircle2 size={30} style={{ color: '#059669' }} />
        </div>
        <div className="text-center">
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0d1c2e' }}>Journal Submitted!</h3>
          <p style={{ fontSize: '0.85rem', color: '#464553', marginTop: '4px' }}>Your entry has been sent for supervisor review.</p>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#777584' }}>Redirecting to My Journals…</p>
      </div>
    );
  }

  const dateLabel = (() => {
    try { return new Date(form.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
    catch { return form.date; }
  })();

  const inputStyle = {
    fontSize: '0.875rem',
    background: '#eff4ff',
    border: '1px solid #c8c4d5',
    borderRadius: '6px',
    color: '#0d1c2e',
    padding: '9px 12px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="p-3.5 rounded-xl mb-5" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
        <p style={{ fontSize: '0.8rem', color: '#065F46' }}>Logging for <strong>{dateLabel}</strong>. Be descriptive — supervisors review for accuracy.</p>
      </div>

      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0d1c2e' }}>Daily Journal Entry</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Date + time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Date', type: 'date', key: 'date', value: form.date },
              { label: 'Time In', type: 'time', key: 'timeIn', value: form.timeIn },
              { label: 'Time Out', type: 'time', key: 'timeOut', value: form.timeOut },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#464553' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#006a61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,16,142,0.10)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#c8c4d5'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
          </div>

          {/* Hours calc */}
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg"
            style={{ background: '#eff4ff', border: '1px solid #c8c4d5' }}
          >
            <Clock size={13} style={{ color: '#777584' }} />
            <span style={{ fontSize: '0.8rem', color: '#464553' }}>
              Hours rendered (excluding 1hr lunch): <strong style={{ color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>{hoursRendered()} hrs</strong>
            </span>
          </div>

          <div style={{ height: '1px', background: '#e6eeff' }} />

          {/* Tasks */}
          <div className="space-y-1.5">
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#464553' }}>
              Tasks / Activities Performed <span style={{ color: '#ba1a1a' }}>*</span>
            </label>
            <Textarea
              placeholder="Describe the tasks and activities you performed today in detail..."
              value={form.tasks}
              onChange={e => setForm(f => ({ ...f, tasks: e.target.value }))}
              className="resize-none"
              style={{ minHeight: '96px', fontSize: '0.875rem', background: '#eff4ff', border: '1px solid #c8c4d5', borderRadius: '6px' }}
            />
            <p style={{ fontSize: '0.67rem', color: '#777584' }}>{form.tasks.length} characters · minimum 50 recommended</p>
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#464553' }}>Skills / Learnings Gained</label>
            <Input
              placeholder="e.g., React, API Integration, Debugging..."
              value={form.skills}
              onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
              style={{ fontSize: '0.875rem', background: '#eff4ff', border: '1px solid #c8c4d5', borderRadius: '6px' }}
            />
            <p style={{ fontSize: '0.67rem', color: '#777584' }}>Separate with commas</p>
          </div>

          {/* Challenges */}
          <div className="space-y-1.5">
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#464553' }}>Challenges Encountered</label>
            <Textarea
              placeholder="Describe difficulties faced today and how you resolved them..."
              value={form.challenges}
              onChange={e => setForm(f => ({ ...f, challenges: e.target.value }))}
              className="resize-none"
              rows={3}
              style={{ fontSize: '0.875rem', background: '#eff4ff', border: '1px solid #c8c4d5', borderRadius: '6px' }}
            />
          </div>

          {/* Attachments */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#464553', display: 'block', marginBottom: '8px' }}>
              Evidence / Attachments (Optional)
            </label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFileSelect} />
            <div
              className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors"
              style={{ borderColor: '#c8c4d5' }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#006a61'; e.currentTarget.style.background = '#D1FAE5'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#c8c4d5'; e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#e6eeff' }}>
                <Upload size={16} style={{ color: '#464553' }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#464553' }}>
                Drop files or <span style={{ color: '#006a61', fontWeight: 500 }}>browse</span>
              </p>
              <p style={{ fontSize: '0.67rem', color: '#777584' }}>PNG, JPG, PDF · max 10 MB · Uploaded to Cloudinary</p>
            </div>
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#eff4ff', border: '1px solid #c8c4d5' }}>
                    {att.uploading
                      ? <Loader2 size={13} className="animate-spin" style={{ color: '#777584', flexShrink: 0 }} />
                      : att.error
                      ? <XCircle size={13} style={{ color: '#ba1a1a', flexShrink: 0 }} />
                      : <ImageIcon size={13} style={{ color: '#006a61', flexShrink: 0 }} />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: '0.78rem', color: '#464553' }}>{att.file.name}</p>
                      {att.error && <p style={{ fontSize: '0.67rem', color: '#ba1a1a' }}>{att.error}</p>}
                      {att.uploading && <p style={{ fontSize: '0.67rem', color: '#777584' }}>Uploading…</p>}
                      {att.url && <p style={{ fontSize: '0.67rem', color: '#006a61' }}>Uploaded ✓</p>}
                    </div>
                    <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: 'pointer' }}>
                      <X size={13} style={{ color: '#777584' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <div className="p-3 rounded-lg" style={{ background: '#ffdad6', border: '1px solid #ba1a1a' }}>
              <p style={{ fontSize: '0.8rem', color: '#93000a' }}>{submitError}</p>
            </div>
          )}

          <div style={{ height: '1px', background: '#e6eeff' }} />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-2 transition-colors"
              style={{ fontSize: '0.8rem', color: draftSaved ? '#059669' : '#777584', cursor: 'pointer' }}
            >
              {draftSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {draftSaved ? 'Draft Saved ✓' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={form.tasks.length < 10 || submitting || attachments.some(a => a.uploading)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all disabled:opacity-40"
              style={{ background: '#006a61', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#005049'; }}
              onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#006a61'; }}
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {submitting ? 'Submitting…' : 'Submit Journal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyJournals() {
  const { data } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const all = data.journalEntries;
  const filtered = filter === 'all' ? all : all.filter(e => e.status === filter);
  const counts = {
    all: all.length,
    pending: all.filter(e => e.status === 'pending').length,
    approved: all.filter(e => e.status === 'approved').length,
    rejected: all.filter(e => e.status === 'rejected').length,
  };

  const filterConfig = [
    { key: 'all' as const,      label: 'All',      dot: '#464553' },
    { key: 'approved' as const, label: 'Approved', dot: '#10B981' },
    { key: 'pending' as const,  label: 'Pending',  dot: '#F59E0B' },
    { key: 'rejected' as const, label: 'Rejected', dot: '#ba1a1a' },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Approved', key: 'approved', color: '#059669', bg: '#D1FAE5' },
          { label: 'Pending',  key: 'pending',  color: '#D97706', bg: '#FEF3C7' },
          { label: 'Rejected', key: 'rejected', color: '#ba1a1a', bg: '#ffdad6' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 text-center" style={{ border: '1px solid #c8c4d5' }}>
            <p style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>
              {counts[s.key as keyof typeof counts]}
            </p>
            <p style={{ fontSize: '0.72rem', color: '#464553', marginTop: '2px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterConfig.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
            style={{
              fontSize: '0.78rem',
              fontWeight: filter === f.key ? 600 : 400,
              background: filter === f.key ? '#0d1c2e' : '#fff',
              color: filter === f.key ? '#fff' : '#464553',
              border: '1px solid',
              borderColor: filter === f.key ? '#0d1c2e' : '#c8c4d5',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: filter === f.key ? '#fff' : f.dot }} />
            {f.key === 'all' ? 'All' : f.key.charAt(0).toUpperCase() + f.key.slice(1)} ({counts[f.key]})
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-card rounded-xl p-10 text-center" style={{ border: '1px solid #c8c4d5' }}>
            <FileText size={26} style={{ color: '#c8c4d5', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.85rem', color: '#777584' }}>No journal entries found</p>
          </div>
        )}
        {filtered.map(entry => (
          <div key={entry.id} className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
            <div
              className="px-5 py-4 cursor-pointer transition-colors"
              onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p style={{ fontWeight: 600, fontSize: '0.87rem', color: '#0d1c2e' }}>
                    {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span style={{ fontSize: '0.7rem', color: '#777584', fontFamily: "'JetBrains Mono', monospace" }}>
                      {entry.timeIn}–{entry.timeOut} · {entry.hoursRendered}h
                    </span>
                  </div>
                  <p style={{ fontSize: '0.77rem', color: '#464553', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.tasks}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={entry.status} />
                  {expanded === entry.id ? <ChevronUp size={14} style={{ color: '#777584' }} /> : <ChevronDown size={14} style={{ color: '#777584' }} />}
                </div>
              </div>
            </div>
            {expanded === entry.id && (
              <div className="px-5 pb-5 pt-4 space-y-3" style={{ background: '#f8f9ff', borderTop: '1px solid #e6eeff' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#777584', marginBottom: '5px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tasks Performed</p>
                  <p style={{ fontSize: '0.83rem', color: '#464553', lineHeight: 1.65 }}>{entry.tasks}</p>
                </div>
                {entry.skillsDeveloped.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#777584', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Skills Developed</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.skillsDeveloped.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-md" style={{ background: '#e6eeff', color: '#1f108e', fontSize: '0.7rem', fontWeight: 500 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#777584', marginBottom: '5px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Challenges</p>
                  <p style={{ fontSize: '0.83rem', color: '#464553', lineHeight: 1.65 }}>{entry.challenges}</p>
                </div>
                {entry.attachments && entry.attachments.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#777584', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.attachments.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-opacity hover:opacity-70"
                          style={{ background: '#e6eeff', color: '#1f108e', fontSize: '0.72rem', border: '1px solid #c8c4d5' }}>
                          <ImageIcon size={11} /> Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {entry.supervisorFeedback && (
                  <div className="p-3.5 rounded-xl" style={{
                    background: entry.status === 'approved' ? '#D1FAE5' : '#ffdad6',
                    border: `1px solid ${entry.status === 'approved' ? '#A7F3D0' : '#ba1a1a'}`,
                  }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: entry.status === 'approved' ? '#15803D' : '#ba1a1a', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Supervisor Feedback
                    </p>
                    <p style={{ fontSize: '0.82rem', color: entry.status === 'approved' ? '#166534' : '#93000a', lineHeight: 1.55 }}>
                      {entry.supervisorFeedback}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceLog() {
  const { data } = useAuth();
  const entries = data.journalEntries;
  const totalHours = entries.reduce((s, e) => s + e.hoursRendered, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Days Present', value: entries.length.toString(), sub: 'submitted entries' },
          { label: 'Total Hours Logged', value: `${totalHours}h`, sub: 'from all entries' },
          { label: 'Average per Day', value: entries.length > 0 ? `${(totalHours / entries.length).toFixed(1)}h` : '0h', sub: 'hours per session' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 text-center" style={{ border: '1px solid #c8c4d5' }}>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e', marginTop: '2px' }}>{s.label}</p>
            <p style={{ fontSize: '0.67rem', color: '#777584' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Attendance Record</p>
        </div>
        {entries.length === 0 ? (
          <div className="p-10 text-center">
            <p style={{ fontSize: '0.82rem', color: '#777584' }}>No attendance records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8f9ff', borderBottom: '1px solid #e6eeff' }}>
                  {['Date', 'Day', 'Time In', 'Time Out', 'Hours', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#777584', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={entry.id}
                    style={{ borderBottom: i < entries.length - 1 ? '1px solid #eff4ff' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-5 py-3.5" style={{ fontSize: '0.83rem', fontWeight: 500, color: '#0d1c2e' }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5" style={{ fontSize: '0.8rem', color: '#464553' }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </td>
                    <td className="px-5 py-3.5" style={{ fontSize: '0.82rem', color: '#464553', fontFamily: "'JetBrains Mono', monospace" }}>{entry.timeIn}</td>
                    <td className="px-5 py-3.5" style={{ fontSize: '0.82rem', color: '#464553', fontFamily: "'JetBrains Mono', monospace" }}>{entry.timeOut}</td>
                    <td className="px-5 py-3.5" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>{entry.hoursRendered}h</td>
                    <td className="px-5 py-3.5"><StatusBadge status={entry.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentModule({ page, onNavigate }: { page: string; onNavigate: (p: string) => void }) {
  if (page === 'new-journal') return <JournalForm onSubmit={() => onNavigate('my-journals')} />;
  if (page === 'my-journals') return <MyJournals />;
  if (page === 'attendance') return <AttendanceLog />;
  return <StudentDashboard onNavigate={onNavigate} />;
}
