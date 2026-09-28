import { AVATAR_CHANNEL } from './avatar-bridge.js';
const validTurnId = value => Number.isSafeInteger(value) && value > 0;

// driver 只负责真实媒体操作；宿主负责来源校验和每轮事件的生命周期。
export function installAvatarHost({ allowedOrigin, allowedSource = parent, driver }) {
  if (!allowedOrigin || allowedOrigin === 'null') throw new Error('需要明确的父页面来源。');
  const hostWindow = window;
  const capabilities = {
    speak: driver.capabilities?.speak === true && typeof driver.speak === 'function',
    interrupt: driver.capabilities?.interrupt === true && typeof driver.interrupt === 'function',
  };
  let connected = false, active = null, disposed = false;
  const send = data => allowedSource.postMessage({ channel: AVATAR_CHANNEL, ...data }, allowedOrigin);
  const cancel = () => {
    if (!active) return;
    const previous = active;
    active = null; // 先隔离旧回调，stop() 触发的 onend 不能冒充自然播放结束。
    try {
      driver.interrupt();
      send({ type: 'speech.cancelled', turnId: previous.turnId, speechId: previous.speechId });
    } catch (error) {
      send({ type: 'error', turnId: previous.turnId, speechId: previous.speechId, message: String(error.message || error) });
    }
  };
  const receive = event => {
    if (disposed || event.source !== allowedSource || event.origin !== allowedOrigin) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || data.channel !== AVATAR_CHANNEL) return;
    if (data.type === 'bridge.hello') {
      connected = true;
      send({ type: 'ready', capabilities, provider: driver.provider || 'custom' });
      return;
    }
    if (!connected) return;
    if (data.type === 'avatar.interrupt') {
      if (capabilities.interrupt && (data.turnId === undefined ||
          (validTurnId(data.turnId) && data.turnId === active?.turnId))) cancel();
      return;
    }
    if (data.type !== 'avatar.speak' || !validTurnId(data.turnId) ||
        typeof data.speechId !== 'string' || !data.speechId || typeof data.text !== 'string' || !data.text.trim()) return;
    if (active) cancel();
    const token = { turnId: data.turnId, speechId: data.speechId, started: false };
    active = token;
    const emit = response => {
      if (disposed || active !== token || !response) return;
      if (!['speech.started', 'speech.ended', 'speech.cancelled', 'speech.error'].includes(response.type)) return;
      if (response.type === 'speech.started') {
        if (token.started) return;
        token.started = true;
      } else active = null;
      send({ type: response.type === 'speech.error' ? 'error' : response.type, turnId: token.turnId, speechId: token.speechId,
        ...(typeof response.message === 'string' ? { message: response.message } : {}) });
    };
    try {
      if (!capabilities.speak) throw new Error('当前环境不支持语音播报。');
      driver.speak({ turnId: data.turnId, speechId: data.speechId, text: data.text }, emit);
    } catch (error) { emit({ type: 'speech.error', message: String(error.message || error) }); }
  };
  hostWindow.addEventListener('message', receive);
  return { dispose() {
    if (disposed) return;
    cancel();
    disposed = true;
    hostWindow.removeEventListener('message', receive);
  } };
}
