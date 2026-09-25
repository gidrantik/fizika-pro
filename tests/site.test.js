const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

function storage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function loadScript(file, globals) {
  const context = vm.createContext(globals);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  return context;
}

test('answer matching rejects extra characters and keeps exam formats', () => {
  const context = loadScript('js/quiz.js', {
    document: { addEventListener() {} }
  });
  const match = context.answersMatch;
  assert.equal(match('12abc', '12'), false);
  assert.equal(match('5 кг', '5'), false);
  assert.equal(match('0012', '12'), false);
  assert.equal(match('3,0', '3'), true);
  assert.equal(match('43', '34', true), true);
  assert.equal(match('34xyz', '34', true), false);
  assert.equal(match('43', '34'), false);
});

test('failed upload stays queued and retries with the same result ID', async () => {
  const localStorage = storage();
  const requests = [];
  let serverOk = false;
  const context = loadScript('js/stats.js', {
    localStorage,
    crypto: webcrypto,
    AbortController,
    setTimeout,
    clearTimeout,
    document: { addEventListener() {}, querySelectorAll() { return []; } },
    window: { addEventListener() {} },
    console: { warn() {}, error() {} },
    getDeviceId() { return 'test-device-1234567890'; },
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_KEY: 'test-key',
    async fetch(url, options) {
      requests.push({ url, options, payload: JSON.parse(options.body) });
      return { ok: serverOk, status: serverOk ? 201 : 540 };
    }
  });

  await context.flushPendingResults();
  const id = context.newResultId();
  assert.equal(context.queueResult({
    id, student: 'Тест', exam: 'oge', topic: 'kinematics',
    topicName: 'Кинематика', correct: 1, total: 2, pct: 50, details: []
  }), true);
  await context.flushPendingResults();
  assert.equal(context.pendingResults().length, 1);
  assert.equal(requests.length, 1);

  serverOk = true;
  await context.flushPendingResults();
  assert.equal(context.pendingResults().length, 0);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].payload.id, id);
  assert.equal(requests[1].payload.id, id);
  assert.equal(requests[1].options.headers.Prefer, 'resolution=ignore-duplicates,return=minimal');
  assert.match(requests[1].url, /on_conflict=id$/);
});

test('first visit returns to the requested topic after entering a name', () => {
  const localStorage = storage();
  const input = { value: 'Ученик' };
  const location = { search: '?exam=oge&topic=kinematics', href: '' };
  const context = loadScript('js/app.js', {
    localStorage,
    crypto: webcrypto,
    URLSearchParams,
    TOPICS: { oge: [{ id: 'kinematics' }] },
    window: { location },
    document: {
      addEventListener() {},
      getElementById(id) { return id === 'student-name' ? input : null; }
    }
  });
  context.startSession();
  assert.equal(location.href, 'topic.html?exam=oge&topic=kinematics');
  assert.equal(localStorage.getItem('studentName'), 'Ученик');
});

test('topic page forwards its query to the name screen', () => {
  const callbacks = [];
  const localStorage = storage();
  let redirect;
  loadScript('js/app.js', {
    localStorage,
    window: {
      location: {
        search: '?exam=oge&topic=kinematics',
        replace(value) { redirect = value; }
      }
    },
    document: {
      addEventListener(event, callback) { if (event === 'DOMContentLoaded') callbacks.push(callback); },
      getElementById(id) { return id === 'header-name' ? {} : null; }
    }
  });
  callbacks[0]();
  assert.equal(redirect, 'index.html?exam=oge&topic=kinematics');
});
