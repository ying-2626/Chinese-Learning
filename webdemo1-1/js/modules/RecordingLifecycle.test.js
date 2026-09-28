const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'SpeechEval.js'), 'utf8');

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function element(text = '') {
    return {
        innerText: text,
        dataset: {},
        attributes: {},
        children: [],
        disabled: false,
        set textContent(value) { this.text = value; this.children = []; },
        get textContent() { return this.text || ''; },
        setAttribute(name, value) { this.attributes[name] = value; },
        append(child) { this.children.push(child); },
        focus() { this.focused = true; }
    };
}

function fixture({ text = '你好', user = { sessionId: 'recording-test-session' } } = {}) {
    const label = element();
    const button = element();
    const content = element(text);
    const status = element();
    const saveStatus = element();
    const modes = ['读汉字', '读句子', '读段落'].map(value => ({ value, disabled: false }));
    const documentEvents = {};
    const windowEvents = {};
    const recorders = [];
    const sockets = [];
    const requests = [];
    const startBehaviors = [];
    const capsuleStates = [];
    const capsuleFrames = [];
    let fetchResult = async () => ({ ok: true, json: async () => ({ code: 0, result: 'wss://speech.example.invalid/test' }) });
    button.querySelector = () => label;
    button.closest = () => ({});

    class Recorder {
        constructor() { this.stopCalls = 0; recorders.push(this); }
        async start(options) {
            this.options = options;
            const behavior = startBehaviors.shift();
            if (behavior) return behavior(this);
            this.onStart();
        }
        stop() { this.stopCalls++; }
    }

    class Socket {
        static OPEN = 1;
        constructor(url) { this.url = url; this.readyState = 0; this.sent = []; this.closeCalls = 0; sockets.push(this); }
        async open() { this.readyState = 1; await this.onopen(); }
        send(data) { assert.equal(this.readyState, 1); this.sent.push(data); }
        close() { this.closeCalls++; this.readyState = 3; this.onclose?.(); }
    }

    const context = {
        module: { exports: {} },
        console: { log() {}, error() {} },
        RecorderManager: Recorder,
        WebSocket: Socket,
        RecordingCapsule: class {
            setState(state) { capsuleStates.push(state); }
            pushFrame(frame) { capsuleFrames.push(frame); }
        },
        LegacyContent: {
            getUser: () => user,
            headers: () => ({ session: user.sessionId }),
            isAuthError: error => error.code === 1013
        },
        CONFIG: { BACKEND_API: 'http://localhost:4195' },
        fetch: (...args) => { requests.push(args); return fetchResult(...args); },
        window: { WebSocket: Socket, addEventListener: (name, handler) => { windowEvents[name] = handler; } },
        document: {
            getElementById: id => ({ btn_control: button, evalText: content, recording_status: status, score_save_status: saveStatus })[id] || null,
            querySelector: selector => selector.includes(':checked') ? modes[0] : null,
            querySelectorAll: () => modes,
            createElement: () => element(),
            addEventListener: (name, handler) => { documentEvents[name] = handler; }
        }
    };
    vm.runInNewContext(source, context, { filename: 'SpeechEval.js' });
    const speech = new context.module.exports();
    return {
        speech, button, label, content, status, modes, recorders, sockets, requests, startBehaviors,
        capsuleStates, capsuleFrames,
        setFetch: behavior => { fetchResult = behavior; },
        leaveModule: () => documentEvents.click({ target: { closest: () => ({ dataset: { module: 'chatbot' } }) } }),
        pagehide: () => windowEvents.pagehide()
    };
}

function assertIdle(f) {
    assert.equal(f.speech.btnStatus, 'CLOSED');
    assert.equal(f.button.disabled, false);
    assert.equal(f.button.attributes['aria-busy'], 'false');
    assert.equal(f.content.attributes.contenteditable, 'true');
    assert.ok(f.modes.every(mode => !mode.disabled));
    assert.equal(f.capsuleStates.at(-1), 'idle');
}

test('a swallowed microphone permission failure returns to idle and permits another attempt', async () => {
    const f = fixture();
    // The bundled recorder resolves without onStart when getUserMedia rejects.
    f.startBehaviors.push(async () => {});
    await f.speech.connectWebSocket();
    await f.sockets[0].open();
    assertIdle(f);
    assert.match(f.status.textContent, /无法启动麦克风/);
    assert.equal(f.sockets[0].closeCalls, 1);
    await f.speech.connectWebSocket();
    await f.sockets[1].open();
    assert.equal(f.speech.btnStatus, 'OPEN');
    assert.equal(f.speech.recorder, f.recorders[1]);
});

for (const departure of ['leaveModule', 'pagehide']) {
    test(`${departure} cancels pending permission and waits for it to settle before allowing another recorder`, async () => {
        const f = fixture();
        const permission = deferred();
        f.startBehaviors.push(async recorder => { await permission.promise; recorder.onStart(); });
        await f.speech.connectWebSocket();
        const firstSocket = f.sockets[0];
        const opening = firstSocket.open();
        f[departure]();
        assertIdle(f);

        await f.speech.connectWebSocket();
        assert.equal(f.recorders.length, 1, 'pending permission must not start another recorder sharing the worker');
        assert.equal(f.sockets.length, 1);
        assert.match(f.status.textContent, /麦克风权限提示/);
        permission.resolve();
        await opening;
        assertIdle(f);
        assert.ok(f.recorders[0].stopCalls > 0, 'late microphone start is stopped');

        await f.speech.connectWebSocket();
        const secondSocket = f.sockets[1];
        await secondSocket.open();
        const secondAttempt = f.speech.activeRecording;
        const stalePcm = new ArrayBuffer(16);
        f.recorders[0].onFrameRecorded({ frameBuffer: stalePcm, isLastFrame: true });
        firstSocket.onerror();
        firstSocket.onclose();

        assert.equal(f.recorders[1].stopCalls, 0);
        assert.equal(f.speech.activeRecording, secondAttempt);
        assert.equal(f.speech.btnStatus, 'OPEN');
        assert.equal(f.speech.iseWS, secondSocket);
        assert.equal(secondSocket.closeCalls, 0);
        assert.equal(secondSocket.sent.length, 0);
        assert.equal(f.speech.audioChunks.length, 0);
        assert.equal(f.capsuleFrames.length, 0);
    });
}

test('stop changes the UI immediately and an empty final frame sends exactly one end message', async () => {
    const f = fixture();
    await f.speech.connectWebSocket();
    const socket = f.sockets[0];
    await socket.open();
    const recorder = f.recorders[0];
    const pcm = new ArrayBuffer(1280);
    recorder.onFrameRecorded({ frameBuffer: pcm, isLastFrame: false });
    assert.equal(socket.sent[0], pcm);
    assert.equal(f.capsuleFrames[0], pcm);
    f.button.onclick();
    assert.equal(f.speech.btnStatus, 'CLOSING');
    assert.equal(f.button.disabled, true);
    assert.equal(f.button.attributes['aria-busy'], 'true');
    assert.equal(f.capsuleStates.at(-1), 'closing');
    assert.equal(recorder.stopCalls, 1);
    f.button.onclick();
    assert.equal(recorder.stopCalls, 1);
    recorder.onFrameRecorded({ frameBuffer: new ArrayBuffer(0), isLastFrame: true });
    recorder.onFrameRecorded({ frameBuffer: new ArrayBuffer(0), isLastFrame: true });
    recorder.onStop();
    assert.deepEqual(socket.sent, [pcm, '{"type":"end"}']);
    assert.equal(f.capsuleFrames.length, 1);
    assert.equal(f.speech.audioChunks.length, 1);
    socket.onmessage({ data: '{"final":1}' });
    assertIdle(f);
    assert.equal(recorder.stopCalls, 1);
    assert.equal(socket.closeCalls, 1);
});

test('empty content focuses the editor without requesting a URL or microphone', async () => {
    const f = fixture({ text: ' \n  ' });
    await f.speech.connectWebSocket();
    assert.match(f.status.textContent, /请输入朗读内容/);
    assert.equal(f.content.focused, true);
    assert.equal(f.requests.length, 0);
    assert.equal(f.recorders.length, 0);
    assert.equal(f.sockets.length, 0);
    assertIdle(f);
});

test('a guest receives a login link without requesting a URL or microphone', async () => {
    const f = fixture({ user: null });
    await f.speech.connectWebSocket();
    assert.match(f.status.textContent, /请先登录/);
    assert.equal(f.status.children[0].href, 'login.html');
    assert.equal(f.requests.length, 0);
    assert.equal(f.recorders.length, 0);
    assertIdle(f);
});

test('content and modes remain locked through connection, recording, and final-result waiting', async () => {
    const f = fixture();
    const response = deferred();
    f.setFetch(() => response.promise);
    const connecting = f.speech.connectWebSocket();
    assert.equal(f.speech.btnStatus, 'CONNECTING');
    assert.equal(f.button.disabled, true);
    assert.equal(f.button.attributes['aria-busy'], 'true');
    assert.equal(f.content.attributes.contenteditable, 'false');
    assert.ok(f.modes.every(mode => mode.disabled));
    await f.speech.connectWebSocket();
    assert.equal(f.requests.length, 1, 'a second start cannot create a concurrent connection');
    response.resolve({ ok: true, json: async () => ({ code: 0, result: 'wss://speech.example.invalid/test' }) });
    await connecting;
    await f.sockets[0].open();
    assert.equal(f.button.disabled, false, 'the recording button remains usable as a stop control');
    assert.equal(f.button.attributes['aria-label'], '停止录音');
    assert.equal(f.content.attributes.contenteditable, 'false');
    assert.ok(f.modes.every(mode => mode.disabled));
    f.button.onclick();
    assert.equal(f.content.attributes.contenteditable, 'false');
    assert.ok(f.modes.every(mode => mode.disabled));
    f.sockets[0].onclose();
    assertIdle(f);
    assert.match(f.status.textContent, /未收到完整测评结果/);
});

test('leaving during the URL request prevents a late response from opening a socket', async () => {
    const f = fixture();
    const response = deferred();
    f.setFetch(() => response.promise);
    const connecting = f.speech.connectWebSocket();
    f.leaveModule();
    response.resolve({ ok: true, json: async () => ({ code: 0, result: 'wss://speech.example.invalid/test' }) });
    await connecting;
    assert.equal(f.sockets.length, 0);
    assertIdle(f);
});

test('an expired login reported by the URL endpoint restores controls and exposes login', async () => {
    const f = fixture();
    f.setFetch(async () => ({ ok: true, json: async () => ({ code: 1013, message: '登录已过期' }) }));
    await f.speech.connectWebSocket();
    assertIdle(f);
    assert.match(f.status.textContent, /登录已过期/);
    assert.equal(f.status.children[0].href, 'login.html');
    assert.equal(f.sockets.length, 0);
});

test('a socket failure stops capture once and later close callbacks do not repeat cleanup', async () => {
    const f = fixture();
    await f.speech.connectWebSocket();
    await f.sockets[0].open();
    f.sockets[0].onerror();
    f.sockets[0].onclose();
    assertIdle(f);
    assert.equal(f.recorders[0].stopCalls, 1);
    assert.equal(f.sockets[0].closeCalls, 1);
    assert.match(f.status.textContent, /评测连接中断/);
});

test('recorder initialization failure after acquiring a track still releases capture', async () => {
    const f = fixture();
    f.startBehaviors.push(async recorder => {
        recorder.audioTracks = [{ readyState: 'live' }];
        throw new Error('AudioContext failed');
    });
    await f.speech.connectWebSocket();
    await f.sockets[0].open();
    assertIdle(f);
    assert.equal(f.recorders[0].stopCalls, 1);
    assert.match(f.status.textContent, /AudioContext failed/);
});
