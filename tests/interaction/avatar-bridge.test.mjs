import test from 'node:test';
import assert from 'node:assert/strict';
import { AvatarBridge, AVATAR_CHANNEL } from '../../webdemo1-1/js/interaction/avatar-bridge.js';
import { installAvatarHost } from '../../webdemo1-1/js/interaction/avatar-host.js';
import { createBrowserSpeechDriver } from '../../webdemo1-1/js/interaction/browser-speech.js';

class Surface {
  constructor(origin) { this.location = { origin, href: `${origin}/` }; this.listeners = new Map(); this.timers = new Map(); this.tick = 0; }
  addEventListener(type, callback) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(callback); }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  dispatch(type, event) { for (const callback of this.listeners.get(type) || []) callback(event); }
  setTimeout(callback) { const id = ++this.tick; this.timers.set(id, callback); return id; }
  clearTimeout(id) { this.timers.delete(id); }
  expire() { for (const callback of [...this.timers.values()]) callback(); }
}

function setup({ host = true, supported = true } = {}) {
  const parent = new Surface('https://school.test');
  const child = new Surface('https://avatar.test');
  const frame = new Surface();
  frame.src = 'https://avatar.test/avatar-lab.html';
  frame.ownerDocument = { defaultView: parent };
  frame.contentWindow = child;
  const events = [], sent = [], calls = [];
  child.postMessage = (data, origin) => {
    sent.push(data);
    if (origin === child.location.origin) child.dispatch('message', { data, origin: parent.location.origin, source: parent });
  };
  parent.postMessage = (data, origin) => {
    if (origin === parent.location.origin) parent.dispatch('message', { data, origin: child.location.origin, source: child });
  };
  const driver = { provider: 'fake', capabilities: { speak: supported, interrupt: supported },
    speak(payload, emit) { calls.push({ payload, emit }); },
    interrupt() { calls.at(-1)?.emit({ type: 'speech.ended' }); calls.at(-1)?.emit({ type: 'speech.cancelled' }); },
  };
  const previous = globalThis.window;
  globalThis.window = child;
  const installed = host ? installAvatarHost({ allowedOrigin: parent.location.origin, allowedSource: parent, driver }) : null;
  globalThis.window = previous;
  const bridge = new AvatarBridge({ iframe: frame, onEvent: event => events.push(event) });
  const incoming = data => parent.dispatch('message', { data: { channel: AVATAR_CHANNEL, ...data }, source: child, origin: child.location.origin });
  return { bridge, parent, child, frame, events, sent, calls, incoming, dispose() { bridge.dispose(); installed?.dispose(); } };
}
const utterance = (speechId = 'speech-1', turnId = 1) => ({ turnId, speechId, text: '你好' });

test('handshake confirms actual capabilities and routes one utterance', async () => {
  const app = setup();
  app.bridge.interrupt();
  const ready = await app.bridge.connect();
  assert.equal(ready.provider, 'fake');
  assert.deepEqual(ready.capabilities, { speak: true, interrupt: true });
  app.bridge.speak(utterance());
  app.calls[0].emit({ type: 'speech.started', turnId: 'forged-id' });
  app.calls[0].emit({ type: 'speech.ended' });
  app.calls[0].emit({ type: 'speech.ended' });
  assert.deepEqual(app.events.map(event => event.type), ['ready', 'speech.started', 'speech.ended']);
  assert.equal(app.events[1].turnId, 1);
  app.dispose();
});

test('bridge validates origin, source, ready schema, and active utterance IDs', async () => {
  const app = setup({ host: false });
  const connecting = app.bridge.connect();
  const ready = { channel: AVATAR_CHANNEL, type: 'ready', provider: 'fake', capabilities: { speak: true, interrupt: true } };
  app.parent.dispatch('message', { data: ready, source: app.child, origin: 'https://evil.test' });
  app.parent.dispatch('message', { data: ready, source: {}, origin: app.child.location.origin });
  app.incoming({ ...ready, capabilities: { speak: 'yes', interrupt: true } });
  assert.equal(app.bridge.ready, false);
  app.incoming(ready);
  await connecting;
  app.bridge.speak(utterance());
  app.incoming({ type: 'speech.ended', ...utterance('old') });
  app.parent.dispatch('message', { data: { channel: AVATAR_CHANNEL, type: 'speech.ended', ...utterance() }, source: {}, origin: app.child.location.origin });
  assert.deepEqual(app.events.map(event => event.type), ['ready']);
  app.dispose();
});

test('host ignores untrusted parents and commands before handshake', () => {
  const app = setup();
  const data = { channel: AVATAR_CHANNEL, type: 'avatar.speak', ...utterance() };
  app.child.dispatch('message', { data, source: app.parent, origin: app.parent.location.origin });
  app.child.dispatch('message', { data: { ...data, type: 'bridge.hello' }, source: {}, origin: app.parent.location.origin });
  app.child.dispatch('message', { data: { ...data, type: 'bridge.hello' }, source: app.parent, origin: 'https://evil.test' });
  app.child.dispatch('message', { data, source: app.parent, origin: app.parent.location.origin });
  assert.equal(app.calls.length, 0);
  app.dispose();
});

test('turnId is a positive safe integer across commands and callbacks', async () => {
  const app = setup();
  await app.bridge.connect();
  for (const turnId of ['1', 0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => app.bridge.speak(utterance('invalid', turnId)), /turnId/);
    app.child.postMessage({ channel: AVATAR_CHANNEL, type: 'avatar.speak', ...utterance('invalid', turnId) }, app.child.location.origin);
  }
  assert.equal(app.calls.length, 0);
  app.bridge.speak(utterance('numeric', 2));
  app.incoming({ type: 'speech.ended', ...utterance('numeric', '2') });
  app.child.postMessage({ channel: AVATAR_CHANNEL, type: 'avatar.interrupt', turnId: 0 }, app.child.location.origin);
  assert.deepEqual(app.events.map(event => event.type), ['ready']);
  app.calls[0].emit({ type: 'speech.started' });
  app.calls[0].emit({ type: 'speech.ended' });
  assert.equal(app.events.at(-1).turnId, 2);
  assert.equal(app.events.at(-1).type, 'speech.ended');
  app.dispose();
});

test('missing host times out without pretending ready; load resends handshake', async () => {
  const app = setup({ host: false });
  const rejected = assert.rejects(app.bridge.connect(), /连接超时/);
  app.frame.dispatch('load', {});
  assert.equal(app.sent.filter(event => event.type === 'bridge.hello').length, 2);
  app.parent.expire();
  await rejected;
  assert.equal(app.bridge.ready, false);
  assert.equal(app.events[0].type, 'bridge.error');
  app.dispose();
});

test('old callbacks cannot finish a new utterance; interrupt reports cancellation once', async () => {
  const app = setup();
  await app.bridge.connect();
  app.bridge.speak(utterance('first'));
  const old = app.calls[0];
  app.bridge.speak(utterance('second'));
  old.emit({ type: 'speech.started' });
  old.emit({ type: 'speech.ended' });
  app.calls[1].emit({ type: 'speech.started' });
  app.bridge.interrupt();
  app.calls[1].emit({ type: 'speech.ended' });
  app.calls[1].emit({ type: 'speech.cancelled' });
  assert.deepEqual(app.events.map(event => event.type), ['ready', 'speech.started', 'speech.cancelled']);
  assert.equal(app.events.at(-1).speechId, 'second');
  app.dispose();
});

test('reload invalidates the connection and old events; reconnect is explicit', async () => {
  const app = setup();
  await app.bridge.connect();
  app.bridge.speak(utterance());
  app.frame.dispatch('load', {});
  assert.equal(app.bridge.ready, false);
  app.calls[0].emit({ type: 'speech.ended' });
  assert.deepEqual(app.events.map(event => event.type), ['ready', 'bridge.error']);
  await app.bridge.connect();
  assert.equal(app.bridge.ready, true);
  app.dispose();
});

test('unsupported driver advertises false capabilities', async () => {
  const app = setup({ supported: false });
  assert.deepEqual((await app.bridge.connect()).capabilities, { speak: false, interrupt: false });
  assert.throws(() => app.bridge.speak(utterance()), /不支持/);
  app.dispose();
});

test('bridge treats ended without started as a terminal error', async () => {
  const app = setup();
  await app.bridge.connect();
  app.bridge.speak(utterance());
  app.calls[0].emit({ type: 'speech.ended' });
  assert.deepEqual(app.events.map(event => event.type), ['ready', 'error']);
  assert.match(app.events.at(-1).message, /未收到播报开始/);
  assert.equal(app.bridge.current, null);
  app.dispose();
});

test('browser driver waits for actual callbacks and suppresses onend after cancel', () => {
  const spoken = [], states = [], events = [];
  const scope = { SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    speechSynthesis: { speak(item) { spoken.push(item); }, getVoices() { return [{ lang: 'zh-CN', name: '中文' }]; }, cancel() { spoken.at(-1)?.onend(); } },
  };
  const driver = createBrowserSpeechDriver({ scope, onState: type => states.push(type) });
  driver.speak(utterance(), event => events.push(event));
  assert.equal(events[0].type, 'speech.error');
  assert.match(events[0].message, /启用语音/);
  driver.enable();
  spoken[0].onstart(); spoken[0].onend();
  driver.speak(utterance(), event => events.push(event));
  assert.equal(events.length, 1);
  spoken[1].onstart();
  driver.interrupt();
  spoken[1].onend(); spoken[1].onerror({ error: 'canceled' });
  assert.deepEqual(events.map(event => event.type), ['speech.error', 'speech.started', 'speech.cancelled']);
  assert.equal(spoken[1].voice.lang, 'zh-CN');
  assert.equal(states.at(-1), 'speech.cancelled');
  assert.equal(createBrowserSpeechDriver({ scope: {} }).capabilities.speak, false);
});

test('browser driver rejects end without start and prefers a local Mandarin voice', () => {
  const spoken = [], events = [], states = [];
  const voices = [
    { name: 'Google 中文', lang: 'zh-CN', localService: false },
    { name: '本地粤语', lang: 'zh-HK', localService: true },
    { name: '本地普通话', lang: 'zh-CN', localService: true },
  ];
  const scope = { SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    speechSynthesis: { speak(item) { spoken.push(item); }, getVoices() { return voices; }, cancel() {} },
  };
  const driver = createBrowserSpeechDriver({ scope, onState: (type, message, voice) => states.push({ type, message, voice }) });
  driver.enable();
  spoken[0].onend();
  assert.equal(states.at(-1).type, 'speech.error');
  driver.speak(utterance(), event => events.push(event));
  spoken[1].onend();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'speech.error');
  assert.match(events[0].message, /浏览器未开始播放/);
  assert.equal(spoken[1].voice.name, '本地普通话');
  assert.deepEqual(states.at(-1).voice, { name: '本地普通话', lang: 'zh-CN', localService: true });
  voices.pop();
  driver.speak(utterance(), () => {});
  assert.equal(spoken[2].voice.name, '本地粤语');
  driver.interrupt();
});
