import test from 'node:test';
import assert from 'node:assert/strict';
import { InteractionController } from '../../webdemo1-1/js/interaction/interaction-controller.js';

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function fixture() {
  const requests = [];
  const spoken = [];
  const cancelled = [];
  const events = [];
  const client = {
    create: async () => ({ sessionId: 'session-a', turnId: 0, agentMode: 'local-script' }),
    submit(event) {
      const result = deferred();
      requests.push({ event, result });
      return result.promise; // Deliberately ignore abort to exercise late responses.
    },
    interrupt: async (...args) => { cancelled.push(args); },
  };
  const avatar = { speak: message => spoken.push(message), interrupt() {} };
  const controller = new InteractionController({ client, avatar, onEvent: event => events.push(event) });
  const finish = (index, text) => {
    const request = requests[index];
    request.result.resolve({ ...request.event, speech: { speechId: `speech-${request.event.turnId}`, text }, view: { title: text } });
  };
  return { controller, requests, spoken, cancelled, events, finish };
}

test('a late reply cannot speak or overwrite a newer turn', async () => {
  const f = fixture();
  await f.controller.start();
  const first = f.controller.submit({ type: 'text.submit', text: '旧内容' });
  const second = f.controller.submit({ type: 'text.submit', text: '新内容' });
  f.finish(1, '新内容');
  await second;
  f.finish(0, '旧内容');
  await first;
  assert.deepEqual(f.spoken.map(item => item.text), ['新内容']);
  assert.equal(f.controller.state.view.title, '新内容');
  assert.deepEqual(f.cancelled, [['session-a', 1]]);
});

test('generating a reply does not mean playback completed', async () => {
  const f = fixture();
  await f.controller.start();
  const request = f.controller.submit({ type: 'action.request', action: 'introduce' });
  f.finish(0, '你好');
  await request;
  assert.equal(f.controller.state.business, 'responded');
  assert.equal(f.controller.state.playback, 'queued');
  assert.equal(f.events.some(event => event.type === 'interaction.completed'), false);
  f.controller.handleAvatarEvent({ type: 'speech.started', turnId: 1, speechId: 'speech-1' });
  assert.equal(f.controller.state.playback, 'playing');
  f.controller.handleAvatarEvent({ type: 'speech.ended', turnId: 1, speechId: 'speech-1' });
  assert.equal(f.controller.state.playback, 'ended');
  assert.equal(f.events.filter(event => event.type === 'interaction.completed').length, 1);
});

test('interrupt suppresses pending replies and cancelled playback never advances', async () => {
  const f = fixture();
  await f.controller.start();
  const request = f.controller.submit({ type: 'text.submit', text: '旧内容' });
  f.controller.interrupt();
  f.finish(0, '旧内容');
  await request;
  assert.equal(f.spoken.length, 0);
  f.controller.handleAvatarEvent({ type: 'speech.ended', turnId: 1, speechId: 'speech-1' });
  assert.equal(f.controller.state.playback, 'cancelled');
  assert.equal(f.events.some(event => event.type === 'interaction.completed'), false);
});

test('an old playback callback cannot finish the current speech', async () => {
  const f = fixture();
  await f.controller.start();
  const first = f.controller.submit({ type: 'text.submit', text: '一' });
  f.finish(0, '一'); await first;
  const second = f.controller.submit({ type: 'text.submit', text: '二' });
  f.finish(1, '二'); await second;
  f.controller.handleAvatarEvent({ type: 'speech.ended', turnId: 1, speechId: 'speech-1' });
  assert.equal(f.controller.state.playback, 'queued');
  f.controller.handleAvatarEvent({ type: 'speech.cancelled', turnId: 2, speechId: 'speech-2' });
  assert.equal(f.controller.state.playback, 'cancelled');
  assert.equal(f.events.some(event => event.type === 'interaction.completed'), false);
});

test('playback failure is visible and the next turn can recover', async () => {
  const f = fixture();
  await f.controller.start();
  const first = f.controller.submit({ type: 'text.submit', text: '一' });
  f.finish(0, '一'); await first;
  f.controller.handleAvatarEvent({ type: 'error', turnId: 1, speechId: 'speech-1', message: '未启用语音' });
  assert.equal(f.controller.state.error, '未启用语音');
  const second = f.controller.submit({ type: 'text.submit', text: '二' });
  f.finish(1, '二'); await second;
  assert.equal(f.controller.state.error, null);
  assert.equal(f.controller.state.playback, 'queued');
});

test('reconnecting playback during session creation does not strand the session', async () => {
  const f = fixture();
  const created = deferred();
  f.controller.client.create = () => created.promise;
  const starting = f.controller.start();
  f.controller.interrupt();
  created.resolve({ sessionId: 'session-a', turnId: 0, agentMode: 'local-script' });
  await starting;
  assert.equal(f.controller.state.business, 'ready');
  assert.equal(f.controller.state.sessionId, 'session-a');
});

test('an embedded avatar without control can prepare text but cannot complete a turn', async () => {
  const f = fixture();
  let connected = false;
  f.controller.avatar.canSpeak = () => connected;
  await f.controller.start();
  const first = f.controller.submit({ type: 'text.submit', text: '待播台词' });
  f.finish(0, '待播台词'); await first;
  assert.equal(f.controller.state.playback, 'unavailable');
  assert.equal(f.controller.state.speechText, '待播台词');
  assert.equal(f.spoken.length, 0);
  f.controller.handleAvatarEvent({ type: 'speech.ended', turnId: 1, speechId: 'speech-1' });
  assert.equal(f.events.some(event => event.type === 'interaction.completed'), false);
  connected = true;
  const second = f.controller.submit({ type: 'text.submit', text: '已连接后的台词' });
  f.finish(1, '已连接后的台词'); await second;
  assert.equal(f.spoken.length, 1);
  assert.equal(f.controller.state.playback, 'queued');
});
