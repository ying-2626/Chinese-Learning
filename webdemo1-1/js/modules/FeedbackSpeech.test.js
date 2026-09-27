const test = require('node:test');
const assert = require('node:assert/strict');
const FeedbackSpeech = require('./FeedbackSpeech.js');

class FakeUtterance {
    constructor(text) {
        this.text = text;
        this.lang = '';
        this.rate = 1;
        this.voice = null;
        this.onstart = null;
        this.onend = null;
        this.onerror = null;
    }
}

function makeSynth(voices = []) {
    return {
        voices,
        spoken: [],
        cancelCalls: 0,
        getVoices() {
            return this.voices;
        },
        cancel() {
            this.cancelCalls += 1;
        },
        speak(utterance) {
            this.spoken.push(utterance);
            if (utterance.onstart) utterance.onstart();
        },
    };
}

test('reports unsupported without browser speech dependencies', () => {
    const speech = new FeedbackSpeech({ synth: null, Utterance: null });

    assert.equal(speech.isSupported(), false);
});

test('prefers a Mandarin voice and applies the requested rate', () => {
    const mandarin = { name: 'Mandarin', lang: 'zh-CN' };
    const synth = makeSynth([
        { name: 'English', lang: 'en-US' },
        mandarin,
    ]);
    const speech = new FeedbackSpeech({ synth, Utterance: FakeUtterance });

    speech.speak('继续练习第三声。', { rate: 0.85 });

    assert.equal(synth.cancelCalls, 1);
    assert.equal(synth.spoken.length, 1);
    assert.equal(synth.spoken[0].lang, 'zh-CN');
    assert.equal(synth.spoken[0].rate, 0.85);
    assert.equal(synth.spoken[0].voice, mandarin);
});

test('reads long feedback sentence by sentence and completes once', () => {
    const synth = makeSynth();
    const speech = new FeedbackSpeech({ synth, Utterance: FakeUtterance });
    let startCalls = 0;
    let endCalls = 0;

    speech.speak('第一句。第二句！第三句？', {
        onStart: () => { startCalls += 1; },
        onEnd: () => { endCalls += 1; },
    });

    assert.equal(synth.spoken[0].text, '第一句。');
    synth.spoken[0].onend();
    assert.equal(synth.spoken[1].text, '第二句！');
    synth.spoken[1].onend();
    assert.equal(synth.spoken[2].text, '第三句？');
    synth.spoken[2].onend();

    assert.equal(startCalls, 1);
    assert.equal(endCalls, 1);
    assert.equal(speech.isReading(), false);
});

test('stop cancels playback and ignores a late cancellation error', () => {
    const synth = makeSynth();
    const speech = new FeedbackSpeech({ synth, Utterance: FakeUtterance });
    let errorCalls = 0;

    speech.speak('第一句。第二句。', {
        onError: () => { errorCalls += 1; },
    });
    const activeUtterance = synth.spoken[0];

    speech.stop();
    activeUtterance.onerror({ error: 'canceled' });
    activeUtterance.onend();

    assert.equal(synth.cancelCalls, 2);
    assert.equal(synth.spoken.length, 1);
    assert.equal(errorCalls, 0);
    assert.equal(speech.isReading(), false);
});

test('rejects empty feedback', () => {
    const speech = new FeedbackSpeech({
        synth: makeSynth(),
        Utterance: FakeUtterance,
    });

    assert.throws(() => speech.speak('   '), /没有可朗读的反馈/);
});

test('clamps unsafe speech rates to the supported product range', () => {
    const synth = makeSynth();
    const speech = new FeedbackSpeech({ synth, Utterance: FakeUtterance });

    speech.speak('慢一点。', { rate: 0.1 });
    assert.equal(synth.spoken[0].rate, 0.6);

    speech.speak('快一点。', { rate: 4 });
    assert.equal(synth.spoken[1].rate, 1.2);
});
