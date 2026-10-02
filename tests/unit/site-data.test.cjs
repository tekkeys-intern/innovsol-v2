// Guards the generated-page data: every role/industry the site links to must exist and be complete.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '../..');
const jobs = JSON.parse(fs.readFileSync(path.join(root, 'content/jobs.json'), 'utf8'));
const inds = JSON.parse(fs.readFileSync(path.join(root, 'content/industries.json'), 'utf8'));

test('every job has the fields the template needs', () => {
  for (const j of Object.values(jobs)) for (const k of ['slug', 'title', 'about', 'responsibilities', 'stack', 'perks', 'hiring']) assert.ok(j[k] && j[k].length !== 0, `${j.slug}.${k}`);
});
test('job slugs match their generated page names', () => {
  for (const s of Object.keys(jobs)) assert.ok(fs.existsSync(path.join(root, `public/careers/${s}.html`)), s);
});
test('every industry has before/after lists of equal intent and stats', () => {
  for (const i of Object.values(inds)) { assert.ok(i.before.length >= 5 && i.after.length >= 5, i.slug); assert.ok(i.stats.length >= 5, i.slug); assert.ok(i.integrations.length >= 5, i.slug); }
});
test('industry pages exist', () => { for (const s of Object.keys(inds)) assert.ok(fs.existsSync(path.join(root, `public/industries/${s}.html`)), s); });
