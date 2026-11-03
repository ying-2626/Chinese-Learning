/** Coordinates turns and actual playback; activity-specific rules stay on the server. */
export class InteractionController {
  constructor({ client, avatar, onChange = () => {}, onEvent = () => {} }) {
    this.client = client;
    this.avatar = avatar;
    this.onChange = onChange;
    this.onEvent = onEvent;
    this.revision = 0;
    this.pending = null;
    this.activeSpeech = null;
    this.state = {
      sessionId: null, turnId: 0, agentMode: null,
      business: 'idle', playback: 'idle', speechText: '', view: null, error: null,
    };
  }

  update(patch) {
    this.state = { ...this.state, ...patch };
    this.onChange(this.state);
  }

  emit(type, detail = {}) { this.onEvent({ type, ...detail }); }

  async start() {
    const revision = ++this.revision;
    this.pending?.abort();
    this.pending = null;
    this.activeSpeech = null;
    this.avatar.interrupt();
    this.update({ business: 'connecting', playback: 'idle', error: null });
    try {
      const session = await this.client.create();
      if (revision !== this.revision) return;
      this.update({ ...session, business: 'ready', playback: 'idle', speechText: '', view: null });
      this.emit('session.ready', { sessionId: session.sessionId });
    } catch (error) {
      if (revision === this.revision) this.fail(error);
    }
  }

  async submit(input) {
    if (!this.state.sessionId) return this.fail(new Error('请先建立会话。'));
    const previousTurn = this.state.turnId;
    const turnId = previousTurn + 1;
    const revision = ++this.revision;
    const sessionId = this.state.sessionId;
    this.pending?.abort();
    this.activeSpeech = null;
    this.avatar.interrupt();
    if (previousTurn > 0) this.cancelOnServer(sessionId, previousTurn);
    const request = new AbortController();
    this.pending = request;
    this.update({ turnId, business: 'processing', playback: 'idle', error: null });
    this.emit('input.received', { turnId, input });
    try {
      const reply = await this.client.submit({ ...input, sessionId, turnId }, request.signal);
      if (revision !== this.revision) {
        this.emit('reply.ignored', { turnId });
        return;
      }
      if (reply.sessionId !== sessionId || reply.turnId !== turnId ||
          typeof reply.speech?.speechId !== 'string' || typeof reply.speech?.text !== 'string') {
        throw new Error('会话回复格式不正确，已停止本轮播放。');
      }
      this.pending = null;
      this.activeSpeech = { turnId, speechId: reply.speech.speechId };
      this.update({ business: 'responded', playback: 'queued', speechText: reply.speech.text, view: reply.view });
      this.emit('reply.received', { turnId, speechId: reply.speech.speechId });
      // 画面可见不代表已获得角色播报能力；未接通时只保留台词准备状态。
      if (this.avatar.canSpeak?.() === false) {
        this.activeSpeech = null;
        this.update({ playback: 'unavailable' });
        this.emit('speech.unavailable', { turnId });
        return;
      }
      this.avatar.speak({ ...this.activeSpeech, text: reply.speech.text });
    } catch (error) {
      if (revision !== this.revision || error.name === 'AbortError') return;
      this.pending = null;
      this.activeSpeech = null;
      this.fail(error);
    }
  }

  handleAvatarEvent(event) {
    if (event.type === 'bridge.error') {
      this.interrupt();
      this.fail(new Error(event.message || '数字人连接已中断，请重新连接。'));
      return;
    }
    const active = this.activeSpeech;
    if (!active || event.turnId !== active.turnId || event.speechId !== active.speechId) return;
    this.emit(event.type, { turnId: event.turnId, speechId: event.speechId });
    if (event.type === 'speech.started') this.update({ playback: 'playing' });
    if (event.type === 'speech.ended') {
      this.activeSpeech = null;
      this.update({ playback: 'ended' });
      this.emit('interaction.completed', { turnId: event.turnId });
    }
    if (event.type === 'speech.cancelled') {
      this.activeSpeech = null;
      this.update({ playback: 'cancelled' });
    }
    if (event.type === 'error') {
      this.activeSpeech = null;
      this.fail(new Error(event.message || '语音播放失败，请在数字人区域启用语音后重试。'));
    }
  }

  interrupt() {
    if (this.state.business === 'connecting') {
      this.avatar.interrupt();
      return; // Reconnecting the player must not discard an in-flight session creation.
    }
    ++this.revision;
    this.pending?.abort();
    this.pending = null;
    this.activeSpeech = null;
    this.avatar.interrupt();
    if (this.state.sessionId && this.state.turnId > 0) {
      this.cancelOnServer(this.state.sessionId, this.state.turnId);
      this.update({ business: 'cancelled', playback: 'cancelled', error: null });
      this.emit('turn.cancelled', { turnId: this.state.turnId });
    }
  }

  cancelOnServer(sessionId, turnId) {
    this.client.interrupt(sessionId, turnId).catch(error => {
      if (error.code === 'stale_turn') return; // A newer input already invalidated this turn.
      this.emit('cancel.error', { turnId, message: error.message });
    });
  }

  fail(error) {
    this.update({ business: 'error', playback: 'error', error: error.message });
    this.emit('interaction.error', { message: error.message, code: error.code });
  }
}
