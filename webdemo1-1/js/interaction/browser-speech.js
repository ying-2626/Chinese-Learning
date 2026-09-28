export function createBrowserSpeechDriver({ scope = window, onState = () => {} } = {}) {
  const synth = scope.speechSynthesis;
  const supported = !!synth && typeof synth.speak === 'function' &&
    typeof synth.cancel === 'function' && typeof scope.SpeechSynthesisUtterance === 'function';
  let enabled = false, current = null, voiceInfo = null;
  const report = (type, message) => onState(type, message, voiceInfo);
  const finish = (job, type, message) => {
    if (current !== job) return;
    current = null;
    job.emit({ type, ...(message ? { message } : {}) });
    report(type, message || '');
  };
  const interrupt = () => {
    if (!current) return;
    const previous = current;
    current = null;
    synth.cancel();
    previous.emit({ type: 'speech.cancelled' });
    report('speech.cancelled', '已停止播报');
  };
  const speak = ({ text }, emit) => {
    interrupt();
    if (!supported || !enabled) {
      const message = supported ? '请先在语音面板点击“启用语音”。' : '当前浏览器不支持语音合成。';
      emit({ type: 'speech.error', message });
      report('speech.error', message);
      return;
    }
    const utterance = new scope.SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    const voices = synth.getVoices();
    const isMandarin = item => /^zh[-_]CN$/i.test(item.lang);
    const isChinese = item => /^zh/i.test(item.lang);
    const voice = voices.find(item => item.localService && isMandarin(item)) ||
      voices.find(item => item.localService && isChinese(item)) || voices.find(isMandarin) || voices.find(isChinese);
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
    voiceInfo = { name: voice?.name || '浏览器默认音色', lang: utterance.lang, localService: voice ? voice.localService === true : null };
    const job = { utterance, emit, started: false };
    current = job;
    utterance.onstart = () => {
      if (current !== job || job.started) return;
      job.started = true;
      emit({ type: 'speech.started' });
      report('speech.started', text);
    };
    utterance.onend = () => job.started ? finish(job, 'speech.ended') :
      finish(job, 'speech.error', '浏览器未开始播放：未收到 onstart，不能确认播报完成。');
    utterance.onerror = event => finish(job, 'speech.error', `浏览器播报失败：${event.error || 'unknown'}`);
    report('speech.pending', '等待浏览器开始播报');
    try { synth.speak(utterance); }
    catch (error) { finish(job, 'speech.error', String(error.message || error)); }
  };
  return {
    provider: 'browser-speech', capabilities: { speak: supported, interrupt: supported }, speak, interrupt,
    enable() {
      if (!supported) { report('speech.error', '当前浏览器不支持语音合成。'); return false; }
      enabled = true;
      speak({ text: '语音已启用' }, () => {});
      return true;
    },
  };
}
