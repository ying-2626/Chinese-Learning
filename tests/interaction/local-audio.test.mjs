import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalAudioDriver } from '../../webdemo1-1/js/interaction/local-audio.js';

const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const settle = () => new Promise(resolve => setImmediate(resolve));
const response = () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) });
const line = (turnId = 1) => ({ turnId, speechId: `speech-${turnId}`, text: '你好' });

function setup(getHeaders) {
  const network = deferred(), decoding = deferred();
  const calls = [], events = [], states = [], sources = [];
  let context;
  class FakeContext {
    constructor() { context = this; this.state = 'suspended'; this.destination = {}; this.decodeCalls = 0; }
    async resume() { this.state = 'running'; }
    decodeAudioData() { this.decodeCalls++; return decoding.promise; }
    createBufferSource() {
      const source = { starts: 0, stops: 0, disconnected: false, onended: null,
        connect() {}, start() { this.starts++; }, stop() { this.stops++; this.onended?.(); },
        disconnect() { this.disconnected = true; },
      };
      sources.push(source); return source;
    }
  }
  const scope = { AudioContext: FakeContext, fetch(url, options) { calls.push({ url, options }); return network.promise; } };
  const driver = createLocalAudioDriver({ scope, getHeaders, onState: (type, message) => states.push({ type, message }) });
  return { driver, network, decoding, calls, events, states, sources, get context() { return context; },
    speak(turnId) { driver.speak(line(turnId), event => events.push(event)); } };
}

test('enable unlocks audio without synthesizing; real start/end determine playback', async () => {
  const app = setup();
  assert.equal(app.driver.provider, 'local-audio');
  assert.equal(await app.driver.enable(), true);
  assert.equal(app.calls.length, 0);
  assert.equal(app.sources.length, 0);
  assert.equal(app.states.at(-1).message, '可接收台词');
  app.speak();
  app.network.resolve(response()); await settle();
  assert.deepEqual(app.events, []);
  app.decoding.resolve({ duration: 2.28 }); await settle();
  assert.equal(app.sources[0].starts, 1);
  assert.deepEqual(app.events.map(event => event.type), ['speech.started']);
  app.sources[0].onended();
  assert.deepEqual(app.events.map(event => event.type), ['speech.started', 'speech.ended']);
  assert.equal(app.sources[0].disconnected, true);
  assert.equal(app.calls[0].options.credentials, 'same-origin');
  assert.deepEqual(JSON.parse(app.calls[0].options.body), { turnId: 1, text: '你好' });
});

test('cancellation during fetch aborts and prevents late decoding or playback', async () => {
  const app = setup(); await app.driver.enable(); app.speak();
  app.driver.interrupt();
  assert.equal(app.calls[0].options.signal.aborted, true);
  app.network.resolve(response()); await settle();
  assert.equal(app.context.decodeCalls, 0);
  assert.equal(app.sources.length, 0);
  assert.deepEqual(app.events.map(event => event.type), ['speech.cancelled']);
});

test('cancellation during decoding prevents late audio from starting', async () => {
  const app = setup(); await app.driver.enable(); app.speak();
  app.network.resolve(response()); await settle();
  assert.equal(app.context.decodeCalls, 1);
  app.driver.interrupt();
  app.decoding.resolve({ duration: 2.28 }); await settle();
  assert.equal(app.sources.length, 0);
  assert.deepEqual(app.events.map(event => event.type), ['speech.cancelled']);
});

test('interrupting playback disconnects it without reporting ended', async () => {
  const app = setup(); await app.driver.enable(); app.speak();
  app.network.resolve(response()); app.decoding.resolve({ duration: 2.28 }); await settle();
  const oldCallback = app.sources[0].onended;
  app.driver.interrupt(); oldCallback();
  assert.deepEqual(app.events.map(event => event.type), ['speech.started', 'speech.cancelled']);
  assert.equal(app.sources[0].stops, 1);
  assert.equal(app.sources[0].disconnected, true);
});

test('suspended context and backend or decode failures remain visible errors', async () => {
  const locked = setup(); locked.speak();
  assert.match(locked.events[0].message, /启用语音/);
  assert.equal(locked.calls.length, 0);
  const unavailable = setup(); await unavailable.driver.enable(); unavailable.speak();
  unavailable.network.resolve({ ok: false, status: 503, json: async () => ({ error: '本机 TTS 不可用' }) }); await settle();
  assert.deepEqual(unavailable.events, [{ type: 'speech.error', message: '本机 TTS 不可用' }]);
  const corrupt = setup(); await corrupt.driver.enable(); corrupt.speak();
  corrupt.network.resolve(response()); await settle(); corrupt.decoding.reject(new Error('无法解码音频')); await settle();
  assert.deepEqual(corrupt.events, [{ type: 'speech.error', message: '无法解码音频' }]);
  assert.equal(corrupt.sources.length, 0);
  const paused = setup(); await paused.driver.enable(); paused.speak();
  paused.network.resolve(response()); await settle(); paused.context.state = 'suspended';
  paused.decoding.resolve({ duration: 2.28 }); await settle();
  assert.equal(paused.events[0].type, 'speech.error');
  assert.equal(paused.sources.length, 0);
});

test('TTS reads the current session header for each request and exposes unauthorized errors', async () => {
  let session = 'session-first';
  const app = setup(() => ({ session }));
  await app.driver.enable(); app.speak();
  assert.equal(app.calls[0].options.headers.session, 'session-first');
  app.driver.interrupt(); session = 'session-refreshed'; app.speak(2);
  assert.equal(app.calls[1].options.headers.session, 'session-refreshed');
  assert.equal(app.calls[1].options.headers['Content-Type'], 'application/json');
  app.network.resolve({ ok: false, status: 401, json: async () => ({ error: 'Invalid session' }) }); await settle();
  assert.equal(app.events.at(-1).type, 'speech.error');
  assert.match(app.events.at(-1).message, /重新登录.*401.*Invalid session/);
  assert.equal(app.sources.length, 0);
});
