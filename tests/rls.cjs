// Row-level-security test against your REAL Supabase project.  npm run test:rls
//
//   ALWAYS runs (anonymous visitor):   reads / writes that must be refused.
//   RUNS WHEN test accounts exist:     candidate isolation, no self-promotion, notes protection, status limits.
//
// Create TWO throw-away candidate accounts in the portal (confirm their emails), then set:
//   TEST_A_EMAIL / TEST_A_PASSWORD   and   TEST_B_EMAIL / TEST_B_PASSWORD
//   (optional) TEST_STAFF_EMAIL / TEST_STAFF_PASSWORD   an account you promoted to recruiter or admin
// Use accounts nobody cares about: the test applies for a role and withdraws it.
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envFile = path.join(__dirname, '../.env');
const fileEnv = fs.existsSync(envFile) ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])) : {};
const env = { ...fileEnv, ...process.env };
const URL_ = env.VITE_SUPABASE_URL, KEY = env.VITE_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) { console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set'); process.exit(2); }

let pass = 0, fail = 0, skipped = 0;
const ok = (name, cond, extra = '') => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name, extra); } };
const client = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
async function login(prefix) {
  const email = env[prefix + '_EMAIL'], password = env[prefix + '_PASSWORD'];
  if (!email || !password) return null;
  const c = client(); const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) { console.log(`  ! could not sign in ${prefix}: ${error.message}`); return null; }
  return { c, id: data.user.id, email };
}

(async () => {
  console.log('Anonymous visitor');
  const anon = client();
  const jobs = await anon.from('jobs').select('id,slug,title').eq('published', true);
  ok('can read published jobs', !jobs.error && jobs.data.length > 0, jobs.error?.message);
  ok('cannot read profiles', ((await anon.from('profiles').select('email')).data || []).length === 0);
  ok('cannot read applications', !!(await anon.from('applications').select('id')).error);
  ok('cannot read enquiries', ((await anon.from('enquiries').select('id')).data || []).length === 0);
  ok('cannot read audit log', ((await anon.from('audit_log').select('id')).data || []).length === 0);
  ok('cannot create a job', !!(await anon.from('jobs').insert({ slug: 'rls-test', title: 'x', published: true })).error);
  ok('cannot call staff RPCs', !!(await anon.rpc('staff_internal_notes', { app_id: '00000000-0000-0000-0000-000000000000' })).error);
  ok('cannot call delete_my_account', !!(await anon.rpc('delete_my_account')).error);

  const A = await login('TEST_A'), B = await login('TEST_B');
  if (!A || !B) { skipped = 1; console.log('\n(candidate tests skipped: set TEST_A_* and TEST_B_* — see header)'); }
  else {
    console.log('\nCandidate A vs candidate B');
    const own = await A.c.from('profiles').select('id,role').eq('id', A.id).maybeSingle();
    ok('A reads own profile as candidate', own.data?.role === 'candidate', JSON.stringify(own.error || own.data));
    ok("A cannot read B's profile", !(await A.c.from('profiles').select('id').eq('id', B.id).maybeSingle()).data);
    const promote = await A.c.from('profiles').update({ role: 'admin' }).eq('id', A.id).select('role');
    const after = await A.c.from('profiles').select('role').eq('id', A.id).maybeSingle();
    ok('A cannot promote self to admin', after.data?.role === 'candidate', JSON.stringify(promote.error || promote.data));
    ok('A cannot read internal_notes (column revoked)', !!(await A.c.from('applications').select('internal_notes')).error);
    ok('A cannot read all profiles', ((await A.c.from('profiles').select('id')).data || []).length === 1);

    const job = jobs.data[0];
    const mine = await A.c.from('applications').select('id,status').eq('job_id', job.id).eq('applicant_id', A.id).maybeSingle();
    let appId = mine.data?.id;
    if (!appId) {
      const ins = await A.c.from('applications').insert({ job_id: job.id, applicant_id: A.id, cover_note: 'RLS test' }).select('id').single();
      ok('A can apply for a published job', !ins.error, ins.error?.message); appId = ins.data?.id;
    } else console.log('  · A already has an application; reusing it');
    const dup = await A.c.from('applications').insert({ job_id: job.id, applicant_id: A.id });
    ok('A cannot apply twice to the same job', !!dup.error);
    const asB = await B.c.from('applications').insert({ job_id: job.id, applicant_id: A.id });
    ok('B cannot create an application as A', !!asB.error);
    ok("B cannot see A's applications", ((await B.c.from('applications').select('id').eq('id', appId)).data || []).length === 0);
    await A.c.from('applications').update({ status: 'offer' }).eq('id', appId);
    const st = await A.c.from('applications').select('status').eq('id', appId).maybeSingle();
    ok('A cannot set their own status to "offer"', st.data?.status !== 'offer', st.data?.status);
    await A.c.from('applications').update({ status: 'withdrawn' }).eq('id', appId);
    const w = await A.c.from('applications').select('status').eq('id', appId).maybeSingle();
    ok('A can withdraw their own application', w.data?.status === 'withdrawn', w.data?.status);
    ok('A cannot create/edit jobs', !!(await A.c.from('jobs').insert({ slug: 'rls-test-2', title: 'x' })).error);
    ok('A cannot call staff RPCs', !!(await A.c.rpc('staff_set_internal_notes', { app_id: appId, note: 'x' })).error);
  }

  const S = await login('TEST_STAFF');
  if (!S) console.log('\n(staff tests skipped: set TEST_STAFF_EMAIL / TEST_STAFF_PASSWORD)');
  else {
    console.log('\nStaff');
    ok('staff can list all applications', !(await S.c.from('applications').select('id,status').limit(5)).error);
    ok('staff can list all profiles', !(await S.c.from('profiles').select('id').limit(5)).error);
    const t = await S.c.from('jobs').insert({ slug: 'rls-test-staff', title: 'RLS test (delete me)', published: false }).select('id').single();
    ok('staff can create a job', !t.error, t.error?.message);
    if (t.data) await S.c.from('jobs').update({ title: 'RLS test (delete me)' }).eq('id', t.data.id);
  }

  console.log(`\n${pass} passed, ${fail} failed${skipped ? ' (some sections skipped)' : ''}`);
  process.exit(fail ? 1 : 0);
})();
