import { AvatarBridge } from './avatar-bridge.js';
import { SessionClient } from './session-client.js';
import { InteractionController } from './interaction-controller.js?v=20261104';

// 数字人对话卡：选场景 → 数字人说开场白（直接播报）→ 学习者回复交给后端大模型（agent.ask）。
const SCENES = [
  {
    id: 'mid-autumn', name: '中秋问答',
    opening: '我们来聊聊中秋节吧！第一个问题：中秋节人们会吃什么？',
    rules: '场景：中秋节文化问答。你扮演主持人，一次只问一个问题（吃什么、赏什么、有什么传说、怎么祝福）。学习者答对就夸奖并问下一题；答错或卡住时给出提示，比如“可以用‘中秋节吃……’来回答”，不要直接公布答案。',
  },
  {
    id: 'restaurant', name: '餐厅点餐',
    opening: '欢迎光临！今天想吃点什么？我们有饺子、面条、宫保鸡丁和麻婆豆腐。',
    rules: '场景：中餐馆点餐。你扮演服务员，菜单有饺子、面条、宫保鸡丁、麻婆豆腐、米饭和茶。引导学习者用“我想点一份……”“我要……”完整表达，并追问数量、口味或饮料。学习者说不完整时，先示范句型再请他重说。',
  },
  {
    id: 'hanzi', name: '汉字寻宝',
    opening: '我来描述一个汉字，你来猜：左边是“木”，右边是“对”。这是什么字？',
    rules: '场景：汉字寻宝。你描述汉字的结构让学习者猜字，第一题答案是“树”（shù）。猜对后请学习者用这个字组一个词，再出下一题（如 林、休、明、好、妈）。猜不出时提示偏旁的意思，不要直接说出答案。',
  },
  {
    id: 'free', name: '自由聊天',
    opening: '你好！我是你的中文陪练。今天想聊点什么？',
    rules: '场景：自由对话陪练。根据学习者的水平使用简单自然的中文，多提开放式问题；学习者出现明显的用词或语法错误时，先自然地复述正确说法，再继续聊天。',
  },
];

const root = document.getElementById('voice-interaction');
const voice = document.getElementById('voice');
const scene = document.getElementById('voice-scene');
const hostedFrame = document.querySelector('#voice-conversation iframe');
const hostedUrl = hostedFrame.dataset.src;
const openButton = document.getElementById('vi-open');
root.innerHTML = `
  <header class="vi-card-heading">
    <h2>和数字人对话</h2>
    <div class="vi-window-actions">
      <button id="vi-restart" type="button" aria-label="重新开始本场景" title="重新开始">↺</button>
      <button id="vi-close" type="button" aria-label="收起对话" title="收起">−</button>
    </div>
  </header>
  <div class="vi-scenes" role="group" aria-label="对话场景">
    ${SCENES.map(item => `<button type="button" data-scene="${item.id}" aria-pressed="false">${item.name}</button>`).join('')}
  </div>
  <div id="vi-auth" class="vi-notice" hidden>登录后才能和数字人对话。<a href="login.html">去登录</a></div>
  <ol id="vi-chat" class="vi-chat" aria-live="polite" aria-label="对话记录"></ol>
  <div id="vi-error" class="vi-notice vi-error" role="alert" hidden></div>
  <form id="vi-form" class="vi-composer">
    <textarea id="vi-text" rows="1" maxlength="1000" aria-label="对数字人说的话" placeholder="先选一个场景"></textarea>
    <button id="vi-stop" type="button" hidden>停止</button>
    <button id="vi-send" class="vi-primary" type="submit" disabled>发送</button>
  </form>`;
const $ = id => root.querySelector(`#vi-${id}`);
let bridge = null, connected = false, checking = false, sceneActive = false;
let entered = false, ownerSession = null, authRequired = false;
let currentScene = null, messages = [];

const contextFor = item => `${item.rules}\n你的开场白（已经对学习者说过）：${item.opening}`;
function friendly(message = '', code) {
  if (/登录已失效|HTTP 401/.test(message)) return '登录已失效，请重新登录。';
  if (/启用语音/.test(message)) return '先点一下数字人画面中的「点击启用语音」，再试一次。';
  if (code === 'agent_failed') return '数字人暂时无法回答，请稍后再试。';
  if (/语音合成|语音服务|发声/.test(message)) return '数字人暂时无法发声，请稍后再试。';
  return '这一轮没有完成，请再试一次。';
}
function showError(message, detail = '') {
  $('error').hidden = !message;
  $('error').textContent = message || '';
  $('error').title = detail;
}
function renderChat() {
  const list = $('chat');
  list.replaceChildren(...messages.map(item => {
    const row = document.createElement('li');
    row.className = `vi-msg vi-msg-${item.role}`;
    row.dataset.status = item.status || '';
    const bubble = document.createElement('p');
    bubble.textContent = item.text;
    row.append(bubble);
    if (item.role === 'avatar' && item.status === 'speaking') {
      const tag = document.createElement('span');
      tag.className = 'vi-speaking';
      tag.textContent = '正在说';
      row.append(tag);
    }
    return row;
  }));
  if (!messages.length) {
    const hint = document.createElement('li');
    hint.className = 'vi-empty';
    hint.textContent = '选一个场景，数字人会先开口。';
    list.append(hint);
  }
  list.scrollTop = list.scrollHeight;
}
function render(state) {
  const signedIn = Boolean(window.LegacyContent.getUser()) && !authRequired;
  const ready = signedIn && connected && Boolean(state.sessionId) && state.business !== 'connecting';
  const busy = state.business === 'processing' || ['queued', 'playing'].includes(state.playback);
  $('auth').hidden = signedIn;
  root.querySelectorAll('[data-scene]').forEach(button => {
    button.disabled = !ready;
    button.setAttribute('aria-pressed', String(button.dataset.scene === currentScene?.id));
  });
  $('text').disabled = !ready || !currentScene;
  $('text').placeholder = currentScene ? '用中文回答数字人…' : '先选一个场景';
  $('send').disabled = !ready || !currentScene;
  $('send').hidden = busy;
  $('stop').hidden = !busy;
  $('restart').disabled = !ready || !currentScene;
  const thinking = state.business === 'processing' && messages.at(-1)?.role === 'learner';
  root.classList.toggle('vi-thinking', thinking);
}

class WorkspaceClient extends SessionClient {
  async request(...args) {
    try { return await super.request(...args); }
    catch (error) { if (error.status === 401) authRequired = true; throw error; }
  }
}
const controller = new InteractionController({
  client: new WorkspaceClient('/api/interaction', { getHeaders: () => window.LegacyContent.headers() }),
  avatar: { canSpeak: () => connected, speak(command) { bridge.speak(command); }, interrupt() { bridge?.interrupt(); } },
  onChange: render,
  onEvent(event) {
    const last = messages.at(-1);
    if (event.type === 'reply.received') {
      messages.push({ role: 'avatar', turnId: event.turnId, text: controller.state.speechText, status: 'queued' });
    } else if (event.type === 'speech.started' && last?.turnId === event.turnId) {
      last.status = 'speaking';
    } else if (['speech.ended', 'turn.cancelled'].includes(event.type) && last?.role === 'avatar') {
      last.status = 'done';
    } else if (event.type === 'interaction.error') {
      if (last?.role === 'avatar') last.status = 'done';
      showError(friendly(event.message, event.code), event.message);
    } else if (event.type === 'speech.unavailable') {
      showError('数字人还在准备，请稍后再试。');
    } else return;
    renderChat();
    render(controller.state);
  },
});

async function startScene(item) {
  currentScene = item;
  messages = [];
  showError('');
  renderChat();
  // 每个场景用新的会话，后端的对话历史随之清空。
  await controller.start();
  if (controller.state.sessionId) controller.submit({ type: 'text.submit', text: item.opening });
}
function sendReply(text) {
  showError('');
  // 新输入会打断正在播报的上一句。
  messages.forEach(item => { if (item.role === 'avatar') item.status = 'done'; });
  messages.push({ role: 'learner', text });
  renderChat();
  controller.submit({ type: 'agent.ask', text, context: contextFor(currentScene) });
}

async function checkBridge(current = bridge) {
  if (!current || current !== bridge || checking) return;
  checking = true;
  try { await current.connect(); }
  catch (_) { showError('数字人画面没有连接上，请刷新页面后再试。'); }
  finally { if (current === bridge) { checking = false; render(controller.state); } }
}
function activateScene() {
  if (sceneActive) return;
  sceneActive = true;
  connected = false;
  bridge = new AvatarBridge({ iframe: hostedFrame, onEvent(event) {
    if (event.type === 'ready') {
      connected = Boolean(event.capabilities.speak && event.capabilities.interrupt);
      render(controller.state);
    } else if (event.type === 'bridge.error') {
      const wasConnected = connected;
      connected = false;
      if (wasConnected) controller.handleAvatarEvent(event);
      render(controller.state);
    } else controller.handleAvatarEvent(event);
  } });
  hostedFrame.src = hostedUrl;
}
hostedFrame.addEventListener('load', () => { if (sceneActive && hostedFrame.getAttribute('src')) checkBridge(); });
function deactivateScene() {
  sceneActive = false;
  controller.interrupt();
  bridge?.dispose();
  bridge = null;
  connected = checking = false;
  hostedFrame.removeAttribute('src'); // 离开模块时卸载人物，避免后台继续发声。
}
async function enterCard() {
  const user = window.LegacyContent.getUser();
  if (user && (!entered || ownerSession !== user.sessionId)) {
    entered = true; authRequired = false; ownerSession = user.sessionId;
    currentScene = null; messages = [];
    renderChat();
    await controller.start();
  }
  render(controller.state);
}
function setOpen(open) {
  root.hidden = !open;
  scene.classList.toggle('vi-with-chat', open); // 对话卡与人物并排，不遮挡人物
  openButton.setAttribute('aria-expanded', String(open));
  openButton.innerHTML = `${open ? '收起对话' : '开始对话'} <span aria-hidden="true">${open ? '−' : '↗'}</span>`;
  if (open) enterCard();
  else { controller.interrupt(); openButton.focus(); }
}
openButton.onclick = () => setOpen(root.hidden);
$('close').onclick = () => setOpen(false);
root.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } });
root.querySelectorAll('[data-scene]').forEach(button => {
  button.onclick = () => startScene(SCENES.find(item => item.id === button.dataset.scene));
});
$('restart').onclick = () => { if (currentScene) startScene(currentScene); };
$('form').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('text').value.trim();
  if (!text || !currentScene) return;
  $('text').value = '';
  sendReply(text);
});
$('text').addEventListener('keydown', event => {
  // Enter 发送，Shift+Enter 换行；输入法组字时不发送。
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    $('form').requestSubmit();
  }
});
$('stop').onclick = () => controller.interrupt();
new MutationObserver(() => {
  if (voice.style.display === 'none') { if (sceneActive) deactivateScene(); }
  else { activateScene(); if (!root.hidden) enterCard(); }
}).observe(voice, { attributes: true, attributeFilter: ['style'] });
window.addEventListener('storage', event => {
  if (event.key === 'user_info') {
    controller.interrupt(); entered = false; authRequired = false;
    if (sceneActive && !root.hidden) enterCard();
    render(controller.state);
  }
});
window.addEventListener('pagehide', deactivateScene);
function start() {
  renderChat();
  render(controller.state);
  if (location.hash === '#voice-interaction') {
    document.querySelector('#sidebar [data-module="voice"]')?.click();
    activateScene(); setOpen(true);
  } else if (voice.style.display !== 'none') activateScene();
}
if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
