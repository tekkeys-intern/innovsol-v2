// Run: npm run test:unit   (Node 22+, uses built-in test runner + type stripping)
const test = require('node:test');
const assert = require('node:assert/strict');
let v;
test.before(async () => { v = await import('../../src/lib/api/validate.ts'); });

test('esc escapes HTML so injected markup is inert', () => {
  assert.equal(v.esc('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  assert.equal(v.esc("a&b'c"), 'a&amp;b&#39;c');
});
test('oneLine removes newlines (header injection)', () => {
  assert.equal(v.oneLine('a\r\nBcc: x@y.z'), 'a Bcc: x@y.z');
});
test('clean strips control chars and caps length', () => {
  assert.equal(v.clean('  hi\u0000\u0007 ', 10), 'hi');
  assert.equal(v.clean('x'.repeat(100), 5), 'xxxxx');
  assert.equal(v.clean(undefined, 5), '');
});
const base = { firstName: 'A', lastName: 'B', email: 'a@b.co', company: 'C' };
test('valid enquiry passes and defaults to kind=contact', () => {
  const r = v.validateEnquiry(base);
  assert.equal(r.ok, true); assert.equal(r.honeypot, false); assert.equal(r.value.kind, 'contact');
});
test('playbook kind is accepted, unknown kinds fall back to contact', () => {
  assert.equal(v.validateEnquiry({ ...base, kind: 'playbook' }).value.kind, 'playbook');
  assert.equal(v.validateEnquiry({ ...base, kind: 'evil' }).value.kind, 'contact');
});
test('missing required fields are rejected', () => {
  for (const k of ['firstName', 'lastName', 'email', 'company']) {
    const r = v.validateEnquiry({ ...base, [k]: '' }); assert.equal(r.ok, false, k);
  }
});
test('bad emails and phones are rejected', () => {
  for (const e of ['nope', 'a@b', '@b.co', 'a b@c.co', 'a@b.c', 'a@b.co,c@d.co']) assert.equal(v.validateEnquiry({ ...base, email: e }).ok, false, e);
  assert.equal(v.validateEnquiry({ ...base, phone: 'abc' }).ok, false);
  assert.equal(v.validateEnquiry({ ...base, phone: '+91 95827 99988' }).ok, true);
});
test('honeypot short-circuits', () => {
  const r = v.validateEnquiry({ ...base, website: 'http://spam' });
  assert.equal(r.ok, true); assert.equal(r.honeypot, true);
});
test('over-long values are truncated, not rejected', () => {
  const r = v.validateEnquiry({ ...base, message: 'm'.repeat(10000) });
  assert.equal(r.value.message.length, 4000);
});
