export type Role = 'student' | 'supervisor' | 'coordinator' | 'admin';
export type JournalStatus = 'pending' | 'approved' | 'rejected';
export type StudentStatus = 'active' | 'completed' | 'not-started';

export interface Student {
  id: string;
  name: string;
  email: string;
  company: string;
  companyId: string;
  supervisorId: string;
  supervisorName: string;
  coordinatorId: string;
  program: string;
  yearSection: string;
  requiredHours: number;
  completedHours: number;
  startDate: string;
  endDate: string;
  status: StudentStatus;
  phone: string;
}

export interface JournalEntry {
  id: string;
  studentId: string;
  studentName: string;
  supervisorId: string;
  date: string;
  timeIn: string;
  timeOut: string;
  hoursRendered: number;
  tasks: string;
  skillsDeveloped: string[];
  challenges: string;
  status: JournalStatus;
  supervisorFeedback?: string;
  reviewedAt?: string;
  submittedAt: string;
  attachments?: string[];
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  contactPerson: string;
  studentsAssigned: number;
  status: 'active' | 'inactive';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  company?: string;
  status: 'active' | 'inactive';
  joinedAt: string;
}

// ── Chart data helpers (computed from live Firestore data) ────────────────────

export function buildWeeklyHoursData(entries: JournalEntry[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  return days.map((day, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    return { day, hours: entries.filter(e => e.date === ds).reduce((s, e) => s + e.hoursRendered, 0) };
  });
}

export function buildStudentCompletionData(students: Student[]) {
  return students.map(s => ({
    name: s.name.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' '),
    completed: s.completedHours,
    target: s.requiredHours,
    pct: s.requiredHours > 0 ? Math.round((s.completedHours / s.requiredHours) * 100) : 0,
  }));
}

export function buildMonthlySubmissionsData(entries: JournalEntry[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, i) => {
    const me = entries.filter(e => new Date(e.date).getMonth() === i);
    return {
      month,
      approved: me.filter(e => e.status === 'approved').length,
      pending: me.filter(e => e.status === 'pending').length,
      rejected: me.filter(e => e.status === 'rejected').length,
    };
  });
}

export function buildRoleDistributionData(users: User[]) {
  const c = { student: 0, supervisor: 0, coordinator: 0, admin: 0 };
  users.forEach(u => { c[u.role]++; });
  return [
    { name: 'Students', value: c.student, color: '#0d9488' },
    { name: 'Supervisors', value: c.supervisor, color: '#1e3a5f' },
    { name: 'Coordinators', value: c.coordinator, color: '#d97706' },
    { name: 'Admins', value: c.admin, color: '#7c3aed' },
  ];
}
