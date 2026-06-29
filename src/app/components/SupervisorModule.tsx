import { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import {
  CheckCircle2, AlertCircle, Clock, Users, FileText,
  Star, ChevronRight, ThumbsUp, ThumbsDown, X, Loader2, ImageIcon,
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import type { JournalEntry } from '../mockData';

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const cfg = {
    pending:  { label: 'Pending Review', bg: '#FEF3C7', color: '#92400E', dot: '#D97706' },
    approved: { label: 'Approved',       bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
    rejected: { label: 'Rejected',       bg: '#ffdad6', color: '#93000a', dot: '#ba1a1a' },
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: cfg.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      <span style={{ color: cfg.color, fontSize: '0.7rem', fontWeight: 600 }}>{cfg.label}</span>
    </span>
  );
}

function ReviewModal({ entry, onClose, onApprove, onReject }: {
  entry: JournalEntry;
  onClose: () => void;
  onApprove: (id: string, fb: string) => Promise<void>;
  onReject: (id: string, fb: string) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState(entry.supervisorFeedback ?? '');
  const [confirming, setConfirming] = useState<'approve' | 'reject' | null>(null);
  const [saving, setSaving] = useState(false);
  const isPending = entry.status === 'pending';

  const handleAction = async (action: 'approve' | 'reject') => {
    setSaving(true);
    try {
      if (action === 'approve') await onApprove(entry.id, feedback);
      else await onReject(entry.id, feedback);
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg bg-card rounded-xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: '1px solid #c8c4d5' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.93rem', color: '#0d1c2e' }}>Review Journal Entry</p>
            <p style={{ fontSize: '0.73rem', color: '#777584', marginTop: '2px' }}>
              {entry.studentName} · {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#777584' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e6eeff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: '#eff4ff', border: '1px solid #e6eeff' }}>
            <div className="flex items-center gap-2">
              <Clock size={13} style={{ color: '#777584' }} />
              <span style={{ fontSize: '0.78rem', color: '#464553', fontFamily: "'JetBrains Mono', monospace" }}>{entry.timeIn} – {entry.timeOut}</span>
            </div>
            <div className="w-px h-4" style={{ background: '#c8c4d5' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>{entry.hoursRendered} hrs</span>
            <div className="ml-auto"><StatusBadge status={entry.status} /></div>
          </div>

          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#777584', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tasks Performed</p>
            <p style={{ fontSize: '0.85rem', color: '#464553', lineHeight: 1.65 }}>{entry.tasks}</p>
          </div>

          {entry.skillsDeveloped.length > 0 && (
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#777584', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Skills Developed</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.skillsDeveloped.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-lg" style={{ background: '#e6eeff', color: '#1f108e', fontSize: '0.72rem', fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#777584', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Challenges Encountered</p>
            <p style={{ fontSize: '0.85rem', color: '#464553', lineHeight: 1.65 }}>{entry.challenges}</p>
          </div>

          {entry.attachments && entry.attachments.length > 0 && (
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#777584', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Attachments</p>
              <div className="flex flex-wrap gap-2">
                {entry.attachments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity"
                    style={{ background: '#e6eeff', color: '#1f108e', border: '1px solid #c8c4d5' }}>
                    <ImageIcon size={11} /> View {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Supervisor Feedback</p>
            <Textarea
              placeholder={isPending ? 'Write feedback for the student (optional but encouraged)…' : 'Feedback already submitted.'}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              disabled={!isPending}
              className="resize-none"
              rows={3}
              style={{ fontSize: '0.85rem', background: '#eff4ff', border: '1px solid #c8c4d5', borderRadius: '6px' }}
            />
          </div>
        </div>

        {/* Footer */}
        {isPending && (
          <div className="px-6 py-4 flex items-center gap-3 justify-end" style={{ borderTop: '1px solid #e6eeff' }}>
            {confirming === null ? (
              <>
                <button type="button"
                  onClick={() => setConfirming('reject')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors"
                  style={{ border: '1px solid #ba1a1a', background: '#ffdad6', color: '#93000a', fontSize: '0.83rem', fontWeight: 600 }}
                >
                  <ThumbsDown size={13} /> Reject
                </button>
                <button type="button"
                  onClick={() => setConfirming('approve')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ background: '#059669', fontSize: '0.83rem', fontWeight: 600 }}
                >
                  <ThumbsUp size={13} /> Approve
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.8rem', color: '#464553', flex: 1 }}>
                  {confirming === 'approve' ? 'Confirm approval?' : 'Confirm rejection?'}
                </p>
                <button type="button"
                  onClick={() => setConfirming(null)}
                  className="px-3 py-1.5 rounded-lg transition-colors"
                  style={{ fontSize: '0.8rem', color: '#464553' }}
                  disabled={saving}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e6eeff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Cancel
                </button>
                <button type="button"
                  onClick={() => handleAction(confirming)}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white disabled:opacity-50"
                  style={{ background: confirming === 'approve' ? '#059669' : '#ba1a1a', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Confirm'}
                </button>
              </>
            )}
          </div>
        )}
        {!isPending && (
          <div className="px-6 py-4" style={{ borderTop: '1px solid #e6eeff' }}>
            <p className="text-center" style={{ fontSize: '0.8rem', color: '#777584' }}>This entry has already been reviewed.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SupervisorDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { data } = useAuth();
  const allEntries = data.journalEntries;
  const pendingEntries = allEntries.filter(e => e.status === 'pending');

  const stats = [
    { label: 'Pending Reviews', value: pendingEntries.length.toString(), color: '#D97706', bg: '#FEF3C7', icon: AlertCircle },
    { label: 'Students Active',  value: data.students.length.toString(),                   color: '#0369A1', bg: '#E0F2FE', icon: Users },
    { label: 'Approved Entries', value: allEntries.filter(e => e.status === 'approved').length.toString(), color: '#059669', bg: '#D1FAE5', icon: CheckCircle2 },
    { label: 'Total Entries',    value: allEntries.length.toString(),                      color: '#6366F1', bg: '#EEF2FF', icon: FileText },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Alert banner */}
      {pendingEntries.length > 0 && (
        <div
          className="p-4 rounded-xl flex items-center justify-between gap-3"
          style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3C7' }}>
              <AlertCircle size={15} style={{ color: '#D97706' }} />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.87rem', color: '#92400E' }}>
                {pendingEntries.length} journal {pendingEntries.length === 1 ? 'entry' : 'entries'} awaiting review
              </p>
              <p style={{ fontSize: '0.75rem', color: '#B45309' }}>Provide feedback to your students promptly</p>
            </div>
          </div>
          <button type="button"
            onClick={() => onNavigate('review')}
            className="px-3 py-1.5 rounded-lg text-white flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: '#D97706', fontSize: '0.78rem', fontWeight: 600 }}
          >
            Review Now
          </button>
        </div>
      )}

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
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assigned Students */}
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Assigned Students</p>
          <button type="button"
            onClick={() => onNavigate('students')}
            className="flex items-center gap-1 transition-colors"
            style={{ fontSize: '0.75rem', fontWeight: 500, color: '#006a61' }}
          >
            View all <ChevronRight size={13} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {data.students.length === 0 ? (
            <p className="text-center py-4" style={{ fontSize: '0.82rem', color: '#777584' }}>No students assigned yet.</p>
          ) : data.students.map(s => {
            const pct = s.requiredHours > 0 ? Math.round((s.completedHours / s.requiredHours) * 100) : 0;
            const pending = allEntries.filter(e => e.studentId === s.id && e.status === 'pending').length;
            return (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: '#eff4ff', border: '1px solid #e6eeff' }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                  style={{ background: '#0d1c2e', fontSize: '0.78rem', fontWeight: 700 }}
                >
                  {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ fontWeight: 600, fontSize: '0.87rem', color: '#0d1c2e' }}>{s.name}</p>
                    {pending > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-white" style={{ background: '#ba1a1a', fontSize: '0.6rem', fontWeight: 700 }}>
                        {pending}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#777584' }}>{s.program} · {s.yearSection}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#006a61', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0d1c2e', fontFamily: "'JetBrains Mono', monospace" }}>{s.completedHours}h</p>
                  <p style={{ fontSize: '0.67rem', color: '#777584' }}>of {s.requiredHours}h</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1c2e' }}>Recent Submissions</p>
        </div>
        {allEntries.length === 0 ? (
          <div className="p-8 text-center"><p style={{ fontSize: '0.82rem', color: '#777584' }}>No journal entries yet.</p></div>
        ) : allEntries.slice(0, 5).map((entry, i) => (
          <div key={entry.id}>
            {i > 0 && <div style={{ height: '1px', background: '#eff4ff' }} />}
            <div className="px-5 py-3.5 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: '#006a61', fontSize: '0.7rem', fontWeight: 700 }}
              >
                {entry.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 600, fontSize: '0.83rem', color: '#0d1c2e' }}>{entry.studentName}</p>
                <p style={{ fontSize: '0.7rem', color: '#777584' }}>
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {entry.hoursRendered}h
                </p>
              </div>
              <StatusBadge status={entry.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewJournals() {
  const { data, approveEntry, rejectEntry } = useAuth();
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const entries = data.journalEntries;
  const filtered = filterStatus === 'all' ? entries : entries.filter(e => e.status === filterStatus);
  const counts = {
    all: entries.length,
    pending: entries.filter(e => e.status === 'pending').length,
    approved: entries.filter(e => e.status === 'approved').length,
    rejected: entries.filter(e => e.status === 'rejected').length,
  };
  const filterConfig = [
    { key: 'all' as const,      dot: '#464553' },
    { key: 'pending' as const,  dot: '#F59E0B' },
    { key: 'approved' as const, dot: '#10B981' },
    { key: 'rejected' as const, dot: '#ba1a1a' },
  ];

  return (
    <div className="p-6 space-y-5">
      {selected && <ReviewModal entry={selected} onClose={() => setSelected(null)} onApprove={approveEntry} onReject={rejectEntry} />}

      <div className="flex items-center gap-2 flex-wrap">
        {filterConfig.map(f => (
          <button type="button"
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
            style={{
              fontSize: '0.78rem', fontWeight: filterStatus === f.key ? 600 : 400,
              background: filterStatus === f.key ? '#0d1c2e' : '#fff',
              color: filterStatus === f.key ? '#fff' : '#464553',
              border: '1px solid',
              borderColor: filterStatus === f.key ? '#0d1c2e' : '#c8c4d5',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: filterStatus === f.key ? '#fff' : f.dot }} />
            {f.key.charAt(0).toUpperCase() + f.key.slice(1)} ({counts[f.key]})
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <CheckCircle2 size={26} style={{ color: '#c8c4d5', margin: '0 auto 10px' }} />
            <p style={{ fontSize: '0.85rem', color: '#777584' }}>No entries in this category</p>
          </div>
        )}
        {filtered.map((entry, i) => (
          <div key={entry.id}>
            {i > 0 && <div style={{ height: '1px', background: '#eff4ff' }} />}
            <div
              className="px-5 py-4 cursor-pointer transition-colors flex items-center gap-4"
              onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              onClick={() => setSelected(entry)}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: '#0d1c2e', fontSize: '0.76rem', fontWeight: 700 }}
              >
                {entry.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontWeight: 600, fontSize: '0.87rem', color: '#0d1c2e' }}>{entry.studentName}</span>
                  <span style={{ fontSize: '0.7rem', color: '#777584', fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {entry.hoursRendered}h
                  </span>
                </div>
                <p style={{ fontSize: '0.77rem', color: '#464553', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.tasks}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={entry.status} />
                <ChevronRight size={14} style={{ color: '#c8c4d5' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyStudents() {
  const { data } = useAuth();
  return (
    <div className="p-6 space-y-5">
      {data.students.length === 0 ? (
        <div className="bg-card rounded-xl p-10 text-center" style={{ border: '1px solid #c8c4d5' }}>
          <Users size={26} style={{ color: '#c8c4d5', margin: '0 auto 10px' }} />
          <p style={{ fontSize: '0.85rem', color: '#777584' }}>No students assigned yet.</p>
        </div>
      ) : data.students.map(s => {
        const pct = s.requiredHours > 0 ? Math.round((s.completedHours / s.requiredHours) * 100) : 0;
        const entries = data.journalEntries.filter(e => e.studentId === s.id);
        return (
          <div key={s.id} className="bg-card rounded-xl p-5" style={{ border: '1px solid #c8c4d5' }}>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: '#0d1c2e', fontSize: '0.9rem', fontWeight: 700 }}
              >
                {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d1c2e' }}>{s.name}</p>
                    <p style={{ fontSize: '0.73rem', color: '#777584' }}>{s.email}</p>
                    <p style={{ fontSize: '0.73rem', color: '#777584' }}>{s.program} · {s.yearSection}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{
                      background: s.status === 'active' ? '#D1FAE5' : '#e6eeff',
                      color: s.status === 'active' ? '#065F46' : '#464553',
                      fontSize: '0.7rem', fontWeight: 600,
                    }}
                  >
                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Hours Done', value: `${s.completedHours}h` },
                    { label: 'Remaining',  value: `${Math.max(0, s.requiredHours - s.completedHours)}h` },
                    { label: 'Entries',    value: entries.length.toString() },
                    { label: 'Pending',    value: entries.filter(e => e.status === 'pending').length.toString() },
                  ].map(stat => (
                    <div key={stat.label} className="text-center p-2.5 rounded-xl" style={{ background: '#eff4ff', border: '1px solid #e6eeff' }}>
                      <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#006a61', fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</p>
                      <p style={{ fontSize: '0.67rem', color: '#777584' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Progress value={pct} className="h-2 flex-1" />
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#006a61', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Evaluations() {
  const { data, appUser } = useAuth();
  const [ratings, setRatings]   = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading]   = useState(true);
  const criteria = [
    { id: 'work_ethic',    label: 'Work Ethic & Punctuality' },
    { id: 'technical',     label: 'Technical Skills' },
    { id: 'communication', label: 'Communication Skills' },
    { id: 'initiative',    label: 'Initiative & Proactiveness' },
    { id: 'teamwork',      label: 'Teamwork & Collaboration' },
  ];

  // Load previously saved evaluations from Firestore on mount
  useEffect(() => {
    if (!appUser?.uid) return;
    const db = getFirestore();
    getDocs(query(collection(db, 'evaluations'), where('supervisorId', '==', appUser.uid)))
      .then(snap => {
        const newRatings: Record<string, number> = {};
        const newComments: Record<string, string> = {};
        snap.docs.forEach(d => {
          const ev = d.data() as Record<string, unknown>;
          const sid = ev.studentId as string;
          const r = (ev.ratings ?? {}) as Record<string, number>;
          Object.entries(r).forEach(([cid, val]) => {
            newRatings[`${sid}_${cid}`] = val;
          });
          if (ev.comment) newComments[sid] = ev.comment as string;
        });
        setRatings(newRatings);
        setComments(newComments);
      })
      .finally(() => setLoading(false));
  }, [appUser?.uid]);

  const handleSave = async () => {
    setSaving(true); setSaveError(''); setSaved(false);
    try {
      const db = getFirestore();
      await Promise.all(
        data.students.map(s => {
          const studentRatings: Record<string, number> = {};
          criteria.forEach(c => {
            const key = `${s.id}_${c.id}`;
            if (ratings[key]) studentRatings[c.id] = ratings[key];
          });
          return setDoc(doc(db, 'evaluations', `${appUser!.uid}_${s.id}`), {
            supervisorId: appUser!.uid,
            studentId: s.id,
            studentName: s.name,
            ratings: studentRatings,
            comment: comments[s.id] ?? '',
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        })
      );
      setSaved(true);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {saved && (
        <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: '#D1FAE5', border: '1px solid #A7F3D0' }}>
          <CheckCircle2 size={17} style={{ color: '#059669' }} />
          <p style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: 500 }}>Evaluations saved successfully!</p>
        </div>
      )}
      {saveError && (
        <div className="p-4 rounded-xl" style={{ background: '#ffdad6', border: '1px solid #ba1a1a' }}>
          <p style={{ fontSize: '0.85rem', color: '#93000a' }}>{saveError}</p>
        </div>
      )}
      {data.students.map(s => (
        <div key={s.id} className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid #c8c4d5' }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #e6eeff' }}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: '#0d1c2e', fontSize: '0.78rem', fontWeight: 700 }}
            >
              {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0d1c2e' }}>{s.name}</p>
              <p style={{ fontSize: '0.7rem', color: '#777584' }}>{s.program} · {s.yearSection}</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-4">
            {criteria.map(c => {
              const key = `${s.id}_${c.id}`;
              const rating = ratings[key] ?? 0;
              return (
                <div key={c.id} className="flex items-center gap-4 flex-wrap">
                  <span className="flex-1 min-w-[140px]" style={{ fontSize: '0.82rem', color: '#464553' }}>{c.label}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button type="button" key={star} onClick={() => setRatings(prev => ({ ...prev, [key]: star }))} className="transition-transform hover:scale-110">
                        <Star size={19} style={{ color: star <= rating ? '#F59E0B' : '#c8c4d5', fill: star <= rating ? '#F59E0B' : '#eff4ff' }} />
                      </button>
                    ))}
                    <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#777584', minWidth: '56px' }}>
                      {rating === 0 ? 'Not rated' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="pt-2">
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0d1c2e', marginBottom: '6px' }}>Overall Comments</p>
              <Textarea
                placeholder={`Additional feedback for ${s.name.split(' ')[0]}…`}
                value={comments[s.id] ?? ''}
                onChange={e => setComments(prev => ({ ...prev, [s.id]: e.target.value }))}
                className="resize-none"
                rows={2}
                style={{ fontSize: '0.83rem', background: '#eff4ff', border: '1px solid #c8c4d5', borderRadius: '6px' }}
              />
            </div>
          </div>
        </div>
      ))}
      {data.students.length > 0 && (
        <div className="flex justify-end">
          <button type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#006a61', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Save Evaluations'}
          </button>
        </div>
      )}
    </div>
  );
}

export function SupervisorModule({ page, onNavigate }: { page: string; onNavigate: (p: string) => void }) {
  if (page === 'review') return <ReviewJournals />;
  if (page === 'students') return <MyStudents />;
  if (page === 'evaluations') return <Evaluations />;
  return <SupervisorDashboard onNavigate={onNavigate} />;
}
