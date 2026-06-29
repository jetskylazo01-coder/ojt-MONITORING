/**
 * OJT Track — Full Firebase Reset Script
 * Wipes all Firestore collections, then re-seeds demo data.
 * Run with: node reset-firebase.mjs
 */

const API_KEY    = 'AIzaSyATC1KfTBsdZC8o7xsNp3sp-vbYRWtIyp0';
const PROJECT_ID = 'ojtmonitoring-b8357';
const FIRESTORE  = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Referer': 'https://ojtmonitoring-b8357.firebaseapp.com',
  'Origin':  'https://ojtmonitoring-b8357.firebaseapp.com',
  'X-Client-Version': 'Node/JsCore/10.0.0/FirebaseCore-web',
};

// ── helpers ──────────────────────────────────────────────────────────────────

function strV(v)  { return { stringValue: String(v) }; }
function intV(v)  { return { integerValue: String(v) }; }
function arrV(items) { return { arrayValue: { values: items } }; }
function fields(obj) { return { fields: obj }; }

function log(msg)  { console.log(`  ✓ ${msg}`); }
function step(msg) { console.log(`\n→ ${msg}`); }
function warn(msg) { console.log(`  ⚠  ${msg}`); }

async function signIn(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Sign-in failed for ${email}: ${data.error?.message}`);
  return { uid: data.localId, idToken: data.idToken };
}

async function createAuthUser(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error?.message ?? '';
    if (msg === 'EMAIL_EXISTS') return null; // already exists
    throw new Error(`Auth error for ${email}: ${msg}`);
  }
  return data.localId;
}

async function listDocs(collection, idToken) {
  const url = `${FIRESTORE}/${collection}?pageSize=300`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    warn(`Could not list ${collection}: ${data.error?.message ?? JSON.stringify(data.error)}`);
    return [];
  }
  if (!data.documents) return [];
  return data.documents.map(d => d.name.split('/').pop());
}

async function deleteDoc(collection, docId, idToken) {
  const url = `${FIRESTORE}/${collection}/${docId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    warn(`Failed to delete ${collection}/${docId}: ${data.error?.message ?? res.status}`);
  }
}

async function setDoc(collection, docId, fieldObj, idToken) {
  const url = `${FIRESTORE}/${collection}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(fields(fieldObj)),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firestore write failed (${collection}/${docId}): ${JSON.stringify(data.error)}`);
}

async function wipeCollection(collection, idToken) {
  const docs = await listDocs(collection, idToken);
  if (docs.length === 0) { log(`${collection} — already empty`); return; }
  for (const id of docs) {
    await deleteDoc(collection, id, idToken);
  }
  log(`${collection} — deleted ${docs.length} document(s)`);
}

// ── accounts ──────────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { role: 'student',     name: 'Juan dela Cruz',    email: 'juan.delacruz@ndkc-ojt.com',  password: 'Student@2026' },
  { role: 'supervisor',  name: 'Maria Santos',      email: 'maria.santos@ndkc-ojt.com',    password: 'Supervisor@2026' },
  { role: 'coordinator', name: 'Dr. Roberto Reyes', email: 'roberto.reyes@ndkc-ojt.com',   password: 'Coordinator@2026' },
  { role: 'admin',       name: 'OJT System Admin',  email: 'admin@ndkc-ojt.com',           password: 'Admin@2026!' },
];

// ── main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log('OJT Track — Firebase Reset');
  console.log('===========================');

  // Sign in as admin first
  step('Signing in as admin…');
  const { uid: adminUid, idToken: adminToken } = await signIn('admin@ndkc-ojt.com', 'Admin@2026!');
  log(`Signed in (uid: ${adminUid})`);

  // Wipe all collections
  step('Wiping Firestore collections…');
  await wipeCollection('journalEntries', adminToken);
  await wipeCollection('evaluations',    adminToken);
  await wipeCollection('students',       adminToken);
  await wipeCollection('companies',      adminToken);
  await wipeCollection('users',          adminToken);

  // Re-seed — sign in each account to get UID (all already exist in Auth)
  step('Fetching UIDs for all demo accounts…');
  const uids = {};
  let freshAdminToken = adminToken;

  for (const acc of ACCOUNTS) {
    const { uid, idToken } = await signIn(acc.email, acc.password);
    uids[acc.role] = uid;
    if (acc.role === 'admin') freshAdminToken = idToken;
    log(`${acc.role}: ${acc.email} (uid: ${uid})`);
  }

  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);
  const endStr = endDate.toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const t2 = twoDaysAgo.toISOString().split('T')[0];
  const now = new Date().toISOString();

  // Re-seed users
  step('Writing /users documents…');

  await setDoc('users', uids.student, {
    name:       strV('Juan dela Cruz'),
    email:      strV('juan.delacruz@ndkc-ojt.com'),
    role:       strV('student'),
    department: strV('CTELAN — College of Teacher Education, Language & Natural Sciences'),
    status:     strV('active'),
    joinedAt:   strV(today),
  }, freshAdminToken);
  log('users/student');

  await setDoc('users', uids.supervisor, {
    name:     strV('Maria Santos'),
    email:    strV('maria.santos@ndkc-ojt.com'),
    role:     strV('supervisor'),
    company:  strV('Notre Dame Technology Hub'),
    status:   strV('active'),
    joinedAt: strV(today),
  }, freshAdminToken);
  log('users/supervisor');

  await setDoc('users', uids.coordinator, {
    name:       strV('Dr. Roberto Reyes'),
    email:      strV('roberto.reyes@ndkc-ojt.com'),
    role:       strV('coordinator'),
    department: strV('CTELAN — College of Teacher Education, Language & Natural Sciences'),
    status:     strV('active'),
    joinedAt:   strV(today),
  }, freshAdminToken);
  log('users/coordinator');

  await setDoc('users', uids.admin, {
    name:       strV('OJT System Admin'),
    email:      strV('admin@ndkc-ojt.com'),
    role:       strV('admin'),
    department: strV('IT Services'),
    status:     strV('active'),
    joinedAt:   strV(today),
  }, freshAdminToken);
  log('users/admin');

  // Re-seed companies
  step('Writing /companies documents…');

  const companyId = 'ndkc-tech-hub';
  await setDoc('companies', companyId, {
    name:             strV('Notre Dame Technology Hub'),
    industry:         strV('Information Technology'),
    location:         strV('Notre Dame of Kidapawan College, Kidapawan City'),
    contactPerson:    strV('Maria Santos'),
    studentsAssigned: intV(1),
    status:           strV('active'),
  }, freshAdminToken);
  log(`companies/${companyId}`);

  await setDoc('companies', 'globalink-solutions', {
    name:             strV('GlobalInk Solutions'),
    industry:         strV('Software Development'),
    location:         strV('Cotabato City'),
    contactPerson:    strV('Carlo Dela Cruz'),
    studentsAssigned: intV(0),
    status:           strV('active'),
  }, freshAdminToken);
  log('companies/globalink-solutions');

  // Re-seed student
  step('Writing /students documents…');

  await setDoc('students', uids.student, {
    name:           strV('Juan dela Cruz'),
    email:          strV('juan.delacruz@ndkc-ojt.com'),
    company:        strV('Notre Dame Technology Hub'),
    companyId:      strV(companyId),
    supervisorId:   strV(uids.supervisor),
    supervisorName: strV('Maria Santos'),
    coordinatorId:  strV(uids.coordinator),
    program:        strV('BS Information Technology'),
    yearSection:    strV('4IT-A'),
    requiredHours:  intV(500),
    completedHours: intV(0),
    startDate:      strV(today),
    endDate:        strV(endStr),
    status:         strV('active'),
    phone:          strV('09171234567'),
    department:     strV('CTELAN'),
  }, freshAdminToken);
  log(`students/${uids.student}`);

  // Re-seed journal entries
  step('Writing /journalEntries documents…');

  await setDoc('journalEntries', 'je_sample_1', {
    studentId:       strV(uids.student),
    studentName:     strV('Juan dela Cruz'),
    supervisorId:    strV(uids.supervisor),
    date:            strV(yStr),
    timeIn:          strV('08:00'),
    timeOut:         strV('17:00'),
    hoursRendered:   intV(8),
    tasks:           strV('Attended morning orientation and briefing. Assisted IT team with hardware inventory documentation. Set up workstations for new hires and configured their software environments. Participated in afternoon team meeting.'),
    skillsDeveloped: arrV([strV('IT Support'), strV('Documentation'), strV('Hardware Setup')]),
    challenges:      strV('Configuring network settings for new workstations took longer than expected due to domain policy restrictions.'),
    status:          strV('pending'),
    submittedAt:     strV(now),
    attachments:     arrV([]),
  }, freshAdminToken);
  log('journalEntries/je_sample_1');

  await setDoc('journalEntries', 'je_sample_2', {
    studentId:          strV(uids.student),
    studentName:        strV('Juan dela Cruz'),
    supervisorId:       strV(uids.supervisor),
    date:               strV(t2),
    timeIn:             strV('08:00'),
    timeOut:            strV('17:00'),
    hoursRendered:      intV(8),
    tasks:              strV('Worked on the company internal helpdesk system. Resolved 5 support tickets related to printer and email configuration. Documented solutions in the internal knowledge base. Assisted senior developer with code review for the ticketing module.'),
    skillsDeveloped:    arrV([strV('Helpdesk Support'), strV('Technical Writing'), strV('Code Review')]),
    challenges:         strV('Encountered a compatibility issue between the legacy ticketing system and the new email client. Resolved by updating the SMTP settings.'),
    status:             strV('approved'),
    supervisorFeedback: strV('Good work today, Juan! Your documentation was thorough and your approach to the support tickets was methodical. Keep it up.'),
    submittedAt:        strV(now),
    reviewedAt:         strV(now),
    attachments:        arrV([]),
  }, freshAdminToken);
  log('journalEntries/je_sample_2');

  console.log('\n===========================');
  console.log('✅  Reset complete!\n');
  console.log('Demo accounts (unchanged passwords):');
  console.log('  Student      juan.delacruz@ndkc-ojt.com     Student@2026');
  console.log('  Supervisor   maria.santos@ndkc-ojt.com      Supervisor@2026');
  console.log('  Coordinator  roberto.reyes@ndkc-ojt.com     Coordinator@2026');
  console.log('  Admin        admin@ndkc-ojt.com              Admin@2026!');
})().catch(err => {
  console.error('\n❌  Reset failed:', err.message);
  process.exit(1);
});
