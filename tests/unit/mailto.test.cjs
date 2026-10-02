const test = require('node:test');
const assert = require('node:assert/strict');
const { applyLink, playbookLink, TO } = require('../../scripts/mailto.cjs');
const parse = (u) => { const m = u.match(/^mailto:([^?]+)\?subject=([^&]*)&body=(.*)$/s); return { to: m[1], subject: decodeURIComponent(m[2]), body: decodeURIComponent(m[3]) }; };

test('apply link targets the hiring mailbox with role in subject', () => {
  const p = parse(applyLink('Data Engineer'));
  assert.equal(p.to, TO); assert.equal(p.subject, 'Application for Data Engineer');
});
test('apply email tells the applicant to attach a resume', () => {
  assert.match(parse(applyLink('X')).body, /attach your resume/i);
});
test('mailto body uses CRLF and stays under client URL limits', () => {
  const u = applyLink('FDE Engagement Lead');
  assert.ok(u.length < 1500, 'length ' + u.length);
  assert.match(parse(u).body, /\r\n/);
});
test('playbook link names the industry', () => {
  const p = parse(playbookLink('Healthcare & Life Sciences'));
  assert.match(p.subject, /Healthcare & Life Sciences/); assert.match(p.body, /Playbook/);
});
