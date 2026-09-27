class FeedbackSpeech {
    constructor(options = {}) {
        const browserWindow = typeof window !== 'undefined' ? window : {};

        this.synth = Object.prototype.hasOwnProperty.call(options, 'synth')
            ? options.synth
            : browserWindow.speechSynthesis;
        this.Utterance = Object.prototype.hasOwnProperty.call(options, 'Utterance')
            ? options.Utterance
            : browserWindow.SpeechSynthesisUtterance;
        this.reading = false;
        this.runId = 0;
    }

    isSupported() {
        return Boolean(this.synth && this.Utterance);
    }

    isReading() {
        return this.reading;
    }

    selectMandarinVoice() {
        const voices = typeof this.synth?.getVoices === 'function'
            ? this.synth.getVoices()
            : [];

        return voices.find((voice) => /^zh-CN$/i.test(voice.lang))
            || voices.find((voice) => /^zh/i.test(voice.lang))
            || null;
    }

    splitSentences(text) {
        return text.match(/[^。！？!?；;\n]+[。！？!?；;]?/g)
            ?.map((sentence) => sentence.trim())
            .filter(Boolean)
            || [];
    }

    speak(text, options = {}) {
        if (!this.isSupported()) {
            throw new Error('当前浏览器不支持语音朗读');
        }

        const normalizedText = String(text || '')
            .replace(/\r\n?/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .trim();

        if (!normalizedText) {
            throw new Error('没有可朗读的反馈');
        }

        const sentences = this.splitSentences(normalizedText);
        if (sentences.length === 0) {
            throw new Error('没有可朗读的反馈');
        }

        this.stop();

        const currentRun = this.runId;
        const requestedRate = Number(options.rate) || 0.85;
        const rate = Math.min(1.2, Math.max(0.6, requestedRate));
        const voice = this.selectMandarinVoice();
        let sentenceIndex = 0;
        let hasStarted = false;

        this.reading = true;

        const readNext = () => {
            if (currentRun !== this.runId) return;

            if (sentenceIndex >= sentences.length) {
                this.reading = false;
                if (options.onEnd) options.onEnd();
                return;
            }

            const utterance = new this.Utterance(sentences[sentenceIndex]);
            sentenceIndex += 1;
            utterance.lang = 'zh-CN';
            utterance.rate = rate;
            if (voice) utterance.voice = voice;

            utterance.onstart = () => {
                if (currentRun !== this.runId || hasStarted) return;
                hasStarted = true;
                if (options.onStart) options.onStart();
            };
            utterance.onend = readNext;
            utterance.onerror = (event) => {
                if (currentRun !== this.runId) return;
                this.reading = false;
                if (options.onError) options.onError(event);
            };

            this.synth.speak(utterance);
        };

        readNext();
    }

    stop() {
        this.runId += 1;
        this.reading = false;
        if (typeof this.synth?.cancel === 'function') {
            this.synth.cancel();
        }
    }
}

if (typeof window !== 'undefined') {
    window.FeedbackSpeech = FeedbackSpeech;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackSpeech;
}
