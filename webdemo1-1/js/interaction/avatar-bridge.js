export const AVATAR_CHANNEL = 'soundarin.avatar.v1';
const speechEvents = new Set(['speech.started', 'speech.ended', 'speech.cancelled', 'error']);
const validId = value => typeof value === 'string' && value.length > 0;
const validTurnId = value => Number.isSafeInteger(value) && value > 0;

// 产品页面只依赖这些命令和事件，不读取 iframe 内的 DOM。
export class AvatarBridge {
  constructor({ iframe, onEvent = () => {} }) {
    this.iframe = iframe;
    this.onEvent = onEvent;
    this.window = iframe.ownerDocument.defaultView;
    this.ready = false;
    this.current = null;
    this.pending = null;
    this.disposed = false;
    this.handleMessage = event => this.receive(event);
    this.handleLoad = () => {
      if (this.ready) this.fail('数字人页面已重新加载，请重新连接。');
      else if (this.pending) this.send('bridge.hello');
    };
    this.window.addEventListener('message', this.handleMessage);
    iframe.addEventListener('load', this.handleLoad);
  }

  connect() {
    if (this.disposed) return Promise.reject(new Error('连接已经释放。'));
    if (this.ready) return Promise.resolve(this.info);
    if (this.pending) return this.pending.promise;
    this.origin = new URL(this.iframe.src, this.window.location.href).origin;
    if (this.origin === 'null') return Promise.reject(new Error('数字人页面需要有效的 HTTP(S) 来源。'));
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    const timer = this.window.setTimeout(() => this.fail('数字人连接超时，未收到握手响应。'), 5000);
    this.pending = { promise, resolve, reject, timer };
    this.send('bridge.hello');
    return promise;
  }

  send(type, payload = {}) {
    this.iframe.contentWindow?.postMessage({ channel: AVATAR_CHANNEL, type, ...payload }, this.origin);
  }

  receive(event) {
    if (this.disposed || event.source !== this.iframe.contentWindow || event.origin !== this.origin) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || data.channel !== AVATAR_CHANNEL) return;
    if (data.type === 'ready' && this.pending) {
      if (!data.capabilities || typeof data.capabilities.speak !== 'boolean' ||
          typeof data.capabilities.interrupt !== 'boolean' || typeof data.provider !== 'string') return;
      this.info = { channel: AVATAR_CHANNEL, type: 'ready', provider: data.provider,
        capabilities: { speak: data.capabilities.speak, interrupt: data.capabilities.interrupt } };
      this.ready = true;
      const pending = this.pending;
      this.pending = null;
      this.window.clearTimeout(pending.timer);
      pending.resolve(this.info);
      this.onEvent(this.info);
      return;
    }
    if (!this.ready || !speechEvents.has(data.type) || !validTurnId(data.turnId) || !validId(data.speechId)) return;
    const current = this.current;
    if (!current || data.turnId !== current.turnId || data.speechId !== current.speechId) return;
    if (current.cancelling && data.type !== 'speech.cancelled' && data.type !== 'error') return;
    const missingStart = data.type === 'speech.ended' && !current.started;
    if (data.type === 'speech.started') {
      if (current.started) return;
      current.started = true;
    } else this.current = null;
    this.onEvent({ channel: AVATAR_CHANNEL, type: missingStart ? 'error' : data.type, turnId: data.turnId,
      speechId: data.speechId, ...(missingStart ? { message: '未收到播报开始事件，不能确认播放完成。' } :
        typeof data.message === 'string' ? { message: data.message } : {}) });
  }

  speak({ turnId, speechId, text }) {
    if (!this.ready || !this.info.capabilities.speak) throw new Error('数字人未连接或不支持播报。');
    if (!validTurnId(turnId) || !validId(speechId) || typeof text !== 'string' || !text.trim()) {
      throw new Error('播报需要有效的 turnId、speechId 和文本。');
    }
    this.current = { turnId, speechId, started: false, cancelling: false };
    this.send('avatar.speak', { turnId, speechId, text });
  }

  interrupt() {
    if (!this.ready || !this.info.capabilities.interrupt) return;
    if (this.current) this.current.cancelling = true;
    this.send('avatar.interrupt', this.current ? { turnId: this.current.turnId } : {});
  }

  fail(message) {
    const current = this.current;
    this.ready = false;
    this.current = null;
    if (this.pending) {
      this.window.clearTimeout(this.pending.timer);
      this.pending.reject(new Error(message));
      this.pending = null;
    }
    this.onEvent({ type: 'bridge.error', message, ...(current || {}) });
  }

  dispose() {
    if (this.disposed) return;
    this.interrupt();
    if (this.pending) {
      this.window.clearTimeout(this.pending.timer);
      this.pending.reject(new Error('连接已经释放。'));
      this.pending = null;
    }
    this.disposed = true;
    this.ready = false;
    this.current = null;
    this.window.removeEventListener('message', this.handleMessage);
    this.iframe.removeEventListener('load', this.handleLoad);
  }
}
