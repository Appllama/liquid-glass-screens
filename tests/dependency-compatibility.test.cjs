const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const test = require('node:test');

const routerRequire = createRequire(require.resolve('expo-router/package.json'));
const queryString = routerRequire('query-string');
const xcode = require('xcode');
const xcodeRequire = createRequire(require.resolve('xcode'));

test('router query parsing preserves screen state, Unicode, duplicates, and empty values', () => {
  assert.deepEqual(
    { ...queryString.parse('state=open&label=night+sky&symbol=%E2%9C%A8&tag=one&tag=two&empty=&flag') },
    { state: 'open', label: 'night sky', symbol: '✨', tag: ['one', 'two'], empty: '', flag: null },
  );
  assert.deepEqual(
    { ...queryString.parse('state=open&literal=%2B%26%3D&percent=100%25&bad=%E0%A4%A') },
    { state: 'open', literal: '+&=', percent: '100%', bad: '%E0%A4%A' },
  );
});

test('router query serialization preserves parameter order and encoded values', () => {
  const params = { state: 'open', label: 'sky + stars', tag: ['one', 'two'] };
  const encoded = queryString.stringify(params, { sort: false });
  assert.equal(encoded, 'state=open&label=sky%20%2B%20stars&tag=one&tag=two');
  assert.deepEqual({ ...queryString.parse(encoded) }, params);
});

test('malformed URI input completes in a bounded child process', () => {
  const script = `
    const { createRequire } = require('node:module');
    const routerRequire = createRequire(require.resolve('expo-router/package.json'));
    const query = routerRequire('query-string');
    const parsed = query.parse('state=open&bad=' + '%FE'.repeat(20000) + '%41');
    process.stdout.write(JSON.stringify({
      state: parsed.state,
      length: parsed.bad.length,
      end: parsed.bad.slice(-1),
    }));
  `;
  const result = execFileSync(process.execPath, ['-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 5000,
  });
  assert.deepEqual(JSON.parse(result), { state: 'open', length: 60001, end: 'A' });
});

test('Xcode tooling still generates unique uppercase 24-character project identifiers', () => {
  const project = xcode.project('compatibility.xcodeproj/project.pbxproj');
  project.hash = { project: { objects: {} } };
  const identifiers = Array.from({ length: 128 }, () => project.generateUuid());
  assert.equal(new Set(identifiers).size, identifiers.length);
  for (const identifier of identifiers) {
    assert.match(identifier, /^[0-9A-F]{12}4[0-9A-F]{3}[89AB][0-9A-F]{7}$/);
  }
});

test('the UUID dependency rejects an undersized output buffer', () => {
  const uuid = xcodeRequire('uuid');
  assert.throws(
    () => uuid.v5('liquid-glass-screens', uuid.v5.DNS, new Uint8Array(8)),
    RangeError,
  );
});
