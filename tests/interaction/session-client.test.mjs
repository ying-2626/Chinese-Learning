import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionClient } from '../../webdemo1-1/js/interaction/session-client.js';

test('session requests read fresh injected headers; default construction stays supported', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ sessionId: 'interaction-session' }) };
  });
  let session = 'login-first';
  const client = new SessionClient('/api/interaction', { getHeaders: () => ({ session }) });
  await client.create();
  session = 'login-refreshed';
  await client.submit({ sessionId: 'interaction-session', turnId: 1 });
  await client.interrupt('interaction-session', 1);
  assert.equal(calls[0].options.headers.session, 'login-first');
  assert.equal(calls[1].options.headers.session, 'login-refreshed');
  assert.equal(calls[2].options.headers.session, 'login-refreshed');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.equal(calls[0].options.credentials, 'same-origin');
  await new SessionClient().create();
  assert.deepEqual(calls[3].options.headers, { 'Content-Type': 'application/json' });
});

test('401 JSON errors retain status and code with a visible login message', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: false, status: 401, json: async () => ({ error: 'Invalid session', code: 'unauthorized' }),
  }));
  await assert.rejects(new SessionClient().create(), error => {
    assert.equal(error.status, 401);
    assert.equal(error.code, 'unauthorized');
    assert.match(error.message, /重新登录.*401.*Invalid session/);
    return true;
  });
});
