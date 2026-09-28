import { AvatarBridge } from './avatar-bridge.js';
import { SessionClient } from './session-client.js';
import { InteractionController } from './interaction-controller.js';

// 互动卡与数字人共用一个场景；只有宿主握手成功才发送播报命令。
const root = document.getElementById('voice-interaction');
const voice = document.getElementById('voice');
const scene = document.getElementById('voice-scene');
const hostedFrame = document.querySelector('#voice-conversation iframe');
const hostedUrl = hostedFrame.dataset.src;
const openButton = document.getElementById('vi-open');
root.innerHTML = `
  <header class="vi-card-heading"><div><span class="vi-mark" aria-hidden="true">✦</span><h2>一起互动</h2></div><div class="vi-window-actions"><button id="vi-dock" type="button" aria-label="将互动卡放到画面下方" title="放到画面下方">↓</button><button id="vi-close" type="button" aria-label="收起互动卡" title="收起">−</button></div></header>
  <div class="vi-card-body">
    <div class="vi-meta"><span id="vi-connection" class="vi-connection">等待连接</span><span id="vi-turn">准备开始</span></div>
    <div id="vi-auth" class="vi-auth" hidden>登录后可以准备本轮互动内容。<a href="login.html">前往登录</a></div>
    <div id="vi-error" class="vi-error" role="alert" hidden></div>
    <div class="vi-prompt"><span id="vi-stage-label">本轮互动</span><h3 id="vi-stage-title">从一句话开始</h3><p id="vi-stage-body">互动内容会显示在这里。后续的题目、选项和反馈，也会留在数字人身边。</p><p id="vi-complete" hidden>本句已播完，可以衔接下一步。</p></div>
    <form id="vi-form"><label for="vi-text">本轮台词</label><textarea id="vi-text" rows="2" maxlength="1000" required placeholder="写下这次想互动的内容…">你好，我们一起开始今天的练习吧。</textarea><div class="vi-actions"><button id="vi-stop" type="button" disabled>停止本轮</button><button id="vi-send" class="vi-primary" type="submit" disabled>准备台词 <span aria-hidden="true">↗</span></button></div></form>
    <p id="vi-playback" class="vi-playback" role="status" aria-live="polite">等待输入</p>
    <details class="vi-details"><summary>连接说明与记录</summary><p id="vi-connection-note">正在检查数字人是否支持互动控制。</p><div class="vi-session"><span id="vi-session-status">等待会话</span><button id="vi-restart" type="button">重新开始</button></div><button id="vi-reconnect" class="vi-link" type="button">重新检查数字人连接</button><ol id="vi-events" aria-label="交互事件"></ol></details>
  </div>`;
const $ = id => root.querySelector(`#vi-${id}`);
let bridge = null, connected = false, checking = false, sceneActive = false;
let entered = false, ownerSession = null, authRequired = false;
const labels = { idle:'等待输入', queued:'等待数字人播报', playing:'数字人正在播报', ended:'本句已播完', cancelled:'本轮已停止', error:'本轮未完成', unavailable:'台词已准备，尚未送达数字人。' };
const descriptions = { 'session.ready':'互动会话已建立', 'input.received':'收到输入', 'reply.received':'台词已准备', 'speech.unavailable':'数字人控制待接入，未发送播报', 'speech.started':'数字人开始播报', 'speech.ended':'数字人自然播完', 'interaction.completed':'可以衔接下一步', 'turn.cancelled':'本轮已停止', 'interaction.error':'本轮未完成', 'cancel.error':'服务端取消未确认' };
function log(event) {
  const row = document.createElement('li');
  row.textContent = `${new Date().toLocaleTimeString('zh-CN',{hour12:false})} · ${event.turnId ? `第 ${event.turnId} 轮 · ` : ''}${descriptions[event.type] || event.type}${event.message ? `：${event.message}` : ''}`;
  $('events').prepend(row);
  while ($('events').children.length > 30) $('events').lastElementChild.remove();
}
function showError(message) { $('error').hidden = !message; $('error').textContent = message || ''; }
function render(state) {
  const signedIn = Boolean(window.LegacyContent.getUser()) && !authRequired;
  const ready = signedIn && Boolean(state.sessionId) && state.business !== 'connecting';
  $('auth').hidden = signedIn;
  $('send').disabled = !ready;
  $('send').innerHTML = `${connected ? '发送给数字人' : '准备台词'} <span aria-hidden="true">↗</span>`;
  $('stop').disabled = state.business !== 'processing' && !['queued','playing'].includes(state.playback);
  $('restart').disabled = !signedIn || state.business === 'connecting';
  $('turn').textContent = state.turnId ? `第 ${state.turnId} 轮` : '准备开始';
  $('playback').textContent = labels[state.playback] || '等待输入';
  $('stage-label').textContent = state.view ? '本轮内容' : '本轮互动';
  $('stage-title').textContent = state.view ? (state.playback === 'unavailable' ? '台词已准备' : state.playback === 'ended' ? '这一轮已完成' : '本轮台词') : '从一句话开始';
  $('stage-body').textContent = state.view?.body || '互动内容会显示在这里。后续的题目、选项和反馈，也会留在数字人身边。';
  $('complete').hidden = state.playback !== 'ended';
  $('session-status').textContent = !signedIn ? '请先登录' : state.business === 'connecting' ? '正在建立会话…' : state.business === 'error' ? '本轮处理失败' : state.sessionId ? '已连接当前账号' : '等待会话';
  $('connection').textContent = connected ? '互动控制已连接' : checking ? '正在检查连接' : '台词准备模式';
  $('connection').dataset.connected = String(connected);
  $('connection-note').textContent = connected ? '数字人已确认可接收台词与停止命令；自然播完后才进入下一步。' : '数字人画面可正常使用，但尚未确认其外部播报接口。此卡片只准备台词，不会代替人物发声，也不会把准备完成当成播报完成。';
  $('reconnect').disabled = checking || !sceneActive;
  showError(state.error);
}
class WorkspaceClient extends SessionClient {
  async request(...args) {
    try { return await super.request(...args); }
    catch (error) { if (error.status === 401) authRequired = true; throw error; }
  }
}
const controller = new InteractionController({
  client:new WorkspaceClient('/api/interaction',{getHeaders:()=>window.LegacyContent.headers()}),
  avatar:{canSpeak:()=>connected, speak(command){ bridge.speak(command); }, interrupt(){ bridge?.interrupt(); }},
  onChange:render, onEvent:log,
});
async function checkBridge(current = bridge) {
  if (!current || current !== bridge || checking) return;
  checking = true;
  render(controller.state);
  try { await current.connect(); }
  catch (_) { /* 没有宿主协议的托管画面保持文本准备模式。 */ }
  finally { if (current === bridge) { checking = false; render(controller.state); } }
}
function activateScene() {
  if (sceneActive) return;
  sceneActive = true;
  connected = false;
  bridge = new AvatarBridge({iframe:hostedFrame,onEvent(event) {
    if (event.type === 'ready') {
      connected = Boolean(event.capabilities.speak && event.capabilities.interrupt);
      render(controller.state);
    } else if (event.type === 'bridge.error') {
      const wasConnected = connected;
      connected = false;
      if (wasConnected) controller.handleAvatarEvent(event);
      render(controller.state);
    } else controller.handleAvatarEvent(event);
  }});
  hostedFrame.src = hostedUrl;
}
hostedFrame.addEventListener('load', () => { if (sceneActive && hostedFrame.getAttribute('src')) checkBridge(); });
function deactivateScene() {
  sceneActive = false;
  controller.interrupt();
  bridge?.dispose();
  bridge = null;
  connected = checking = false;
  hostedFrame.removeAttribute('src'); // 离开模块时结束原托管会话，避免后台声音或录音。
}
async function enterCard() {
  const user = window.LegacyContent.getUser();
  if (user && (!entered || ownerSession !== user.sessionId)) {
    entered = true; authRequired = false; ownerSession = user.sessionId;
    await controller.start();
  }
  render(controller.state);
}
function setOpen(open) {
  root.hidden = !open;
  openButton.setAttribute('aria-expanded',String(open));
  openButton.innerHTML = `${open ? '收起互动卡' : '展开互动卡'} <span aria-hidden="true">${open ? '−' : '↗'}</span>`;
  if (open) { enterCard(); }
  else { controller.interrupt(); openButton.focus(); }
}
openButton.onclick = () => setOpen(root.hidden);
$('close').onclick = () => setOpen(false);
$('dock').onclick = () => {
  const below = scene.dataset.placement !== 'below';
  scene.dataset.placement = below ? 'below' : 'overlay';
  $('dock').textContent = below ? '↗' : '↓';
  $('dock').title = below ? '放回数字人画面' : '放到画面下方';
  $('dock').setAttribute('aria-label',below ? '将互动卡放回数字人画面' : '将互动卡放到画面下方');
  root.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
};
root.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } });
$('form').addEventListener('submit',event => {
  event.preventDefault();
  const text = $('text').value.trim();
  if (!text) return showError('先写一句想互动的内容。');
  controller.submit({type:'text.submit',text});
});
$('stop').onclick = () => controller.interrupt();
$('restart').onclick = () => { ownerSession = window.LegacyContent.getUser()?.sessionId; entered = true; controller.start(); };
$('reconnect').onclick = () => checkBridge();
new MutationObserver(() => {
  if (voice.style.display === 'none') { if (sceneActive) deactivateScene(); }
  else { activateScene(); if (!root.hidden) enterCard(); }
}).observe(voice,{attributes:true,attributeFilter:['style']});
window.addEventListener('storage',event => {
  if (event.key === 'user_info') {
    controller.interrupt(); entered = false; authRequired = false;
    if (sceneActive && !root.hidden) enterCard();
    render(controller.state);
  }
});
window.addEventListener('pagehide',deactivateScene);
function start() {
  render(controller.state);
  if (location.hash === '#voice-interaction') {
    document.querySelector('#sidebar [data-module="voice"]')?.click();
    activateScene(); setOpen(true);
  } else if (voice.style.display !== 'none') activateScene();
}
if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
