// 本机 TTS 返回真实 WAV；只有浏览器音频节点开始/结束才发送播放事件。
export function createLocalAudioDriver({ scope = window, onState = () => {}, getHeaders = () => ({}) } = {}) {
  const Context = scope.AudioContext || scope.webkitAudioContext;
  const supported = typeof Context === 'function' && typeof scope.fetch === 'function';
  let context = null, current = null;
  const cleanup = (job, stop = false) => {
    if (!job.source) return;
    job.source.onended = null;
    if (stop) job.source.stop();
    job.source.disconnect();
    job.source = null;
  };
  const finish = (job, type, message = '') => {
    if (current !== job) return;
    current = null;
    cleanup(job);
    job.emit({ type, ...(message ? { message } : {}) });
    onState(type, message);
  };
  const interrupt = () => {
    if (!current) return;
    const previous = current;
    current = null;
    previous.controller.abort();
    cleanup(previous, true);
    previous.emit({ type: 'speech.cancelled' });
    onState('speech.cancelled', '已停止播报');
  };
  const speak = ({ turnId, text }, emit) => {
    interrupt();
    if (!supported || !context || context.state !== 'running') {
      const message = supported ? '请先点击“启用语音”，让浏览器允许音频播放。' : '当前浏览器不支持音频播放。';
      emit({ type: 'speech.error', message });
      onState('speech.error', message);
      return;
    }
    const job = { emit, source: null, controller: new AbortController() };
    current = job;
    onState('speech.pending', '正在合成本轮台词');
    (async () => {
      try {
        const response = await scope.fetch('/api/interaction/tts', {
          method: 'POST', credentials: 'same-origin', signal: job.controller.signal,
          headers: { ...getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ turnId, text }),
        });
        if (current !== job) return;
        if (!response.ok) {
          const detail = await response.json().catch(() => null);
          const message = typeof detail?.message === 'string' ? detail.message : typeof detail?.error === 'string' ? detail.error : '';
          throw new Error(response.status === 401 ? `登录已失效，请重新登录（HTTP 401）。${message}` :
            message || `本机语音服务不可用（HTTP ${response.status}）。`);
        }
        const bytes = await response.arrayBuffer();
        if (current !== job) return;
        const audio = await context.decodeAudioData(bytes);
        if (current !== job) return;
        if (context.state !== 'running') throw new Error('浏览器音频已暂停，请重新点击“启用语音”。');
        const source = context.createBufferSource();
        job.source = source;
        source.buffer = audio;
        source.connect(context.destination);
        source.onended = () => finish(job, 'speech.ended');
        source.start();
        emit({ type: 'speech.started' });
        onState('speech.started', text);
      } catch (error) {
        if (current === job) finish(job, 'speech.error', String(error.message || error));
      }
    })();
  };
  return {
    provider: 'local-audio', capabilities: { speak: supported, interrupt: supported }, speak, interrupt,
    async enable() {
      try {
        if (!supported) throw new Error('当前浏览器不支持音频播放。');
        if (!context || context.state === 'closed') context = new Context();
        await context.resume();
        if (context.state !== 'running') throw new Error('浏览器尚未允许音频播放，请再次点击启用。');
        onState('audio.ready', '可接收台词');
        return true;
      } catch (error) { onState('speech.error', String(error.message || error)); return false; }
    },
  };
}
