/* A visual meter for the existing recorder. Never opens a microphone or owns audio. */
class RecordingCapsule {
    constructor(container) {
        this.container = container;
        this.path = container.querySelector('.recording-wave path');
        this.clock = container.querySelector('.recording-time');
        this.levels = Array(24).fill(0);
        this.state = 'idle';
        this.envelope = 0;
        this.target = 0;
        this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.onVisibility = () => this.syncLoop();
        document.addEventListener('visibilitychange', this.onVisibility);
        this.reduced.addEventListener('change', this.onVisibility);
        this.draw();
    }

    static levelFromPCM(buffer) {
        const view = new DataView(buffer);
        const count = Math.floor(view.byteLength / 2);
        if (!count) return 0;
        let squares = 0;
        for (let index = 0; index < count; index++) {
            const sample = view.getInt16(index * 2, true) / 32768;
            squares += sample * sample;
        }
        return Math.sqrt(squares / count);
    }

    pushFrame(buffer) {
        if (this.state !== 'recording' || !buffer?.byteLength) return;
        this.target = Math.min(1, Math.sqrt(RecordingCapsule.levelFromPCM(buffer)) * 2);
        this.lastPCM = performance.now();
    }

    setState(state) {
        if (this.state === state) return;
        this.state = state;
        this.container.dataset.state = state;
        this.target = this.envelope = 0;
        this.levels.fill(0);
        this.draw();
        if (state === 'recording') {
            this.startedAt = performance.now();
            this.lastPCM = 0;
            this.clock.textContent = '0:00';
        }
        this.syncLoop();
    }

    updateTime() {
        const elapsed = Math.floor((performance.now() - this.startedAt) / 1000);
        const text = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
        if (this.clock.textContent !== text) this.clock.textContent = text;
    }

    draw() {
        this.path.setAttribute('d', this.levels.map((level, index) => {
            const half = 1 + level * 11;
            return `M${3 + index * 5} ${14 - half}v${half * 2}`;
        }).join(' '));
    }

    syncLoop() {
        cancelAnimationFrame(this.frame);
        clearInterval(this.timer);
        this.frame = this.timer = null;
        if (this.state !== 'recording' || document.hidden) return;
        this.updateTime();
        if (this.reduced.matches) {
            this.levels.fill(0);
            this.draw();
            this.timer = setInterval(() => this.updateTime(), 1000);
            return;
        }
        let lastFrame = performance.now();
        let lastPaint = lastFrame;
        const tick = now => {
            const target = now - this.lastPCM < 180 ? this.target : 0;
            const timeConstant = target > this.envelope ? 35 : 150;
            this.envelope += (target - this.envelope) * (1 - Math.exp(-(now - lastFrame) / timeConstant));
            lastFrame = now;
            if (now - lastPaint >= 45) {
                this.levels.shift();
                this.levels.push(this.envelope);
                this.draw();
                this.updateTime();
                lastPaint = now;
            }
            this.frame = requestAnimationFrame(tick);
        };
        this.frame = requestAnimationFrame(tick);
    }

    destroy() {
        this.setState('idle');
        document.removeEventListener('visibilitychange', this.onVisibility);
        this.reduced.removeEventListener('change', this.onVisibility);
    }
}

if (typeof window !== 'undefined') window.RecordingCapsule = RecordingCapsule;
if (typeof module !== 'undefined' && module.exports) module.exports = RecordingCapsule;
